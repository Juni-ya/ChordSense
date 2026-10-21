import * as ort from 'onnxruntime-web';
import initWasm, { CqtEngine } from '../wasm/pkg/chordsense_wasm';
import type { SongAnalysisResponse, ChordSegment } from '../types';

// Configure onnxruntime-web WASM backend binaries from CDN for reliable browser loading
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/';
ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);

const TARGET_SR = 22050;
const HOP = 2048;
const N_BINS = 144;
const TIMESTEP = 108;
const FRAME_SEC = HOP / TARGET_SR; // ~0.09288s

const BTC_LABELS = [
  'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em',
  'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am',
  'A#', 'A#m', 'B', 'Bm', 'N',
];

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major & Minor Krumhansl-Schmuckler profiles for key estimation
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

let wasmInitialized = false;
let cqtEngineMemo: CqtEngine | null = null;
let onnxSessionMemo: ort.InferenceSession | null = null;

async function getEngine(): Promise<CqtEngine> {
  if (!wasmInitialized) {
    await initWasm();
    wasmInitialized = true;
  }
  if (!cqtEngineMemo) {
    cqtEngineMemo = new CqtEngine();
  }
  return cqtEngineMemo;
}

async function getOnnxSession(): Promise<ort.InferenceSession> {
  if (onnxSessionMemo) return onnxSessionMemo;
  console.log('[localAnalyzer] Loading in-browser BTC ONNX model...');
  
  // Prefer WebGPU for hardware acceleration, fallback to CPU WASM
  onnxSessionMemo = await ort.InferenceSession.create('/models/btc.onnx', {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });
  console.log('[localAnalyzer] In-browser BTC ONNX model ready.');
  return onnxSessionMemo;
}

/**
 * Resamples and decodes any browser-supported audio file (MP3, WAV, M4A, etc.) to 22,050Hz Mono PCM.
 * Uses clean universal downmix with a 45Hz highpass filter:
 * - Cuts DC rumble (<45Hz) while preserving bass guitar, piano low fundamentals, and full stereo image
 * - No phase-cancelling mid/side subtraction (prevents cancellation of stereo pianos)
 */
export async function decodeAudioToPCM(
  audioData: ArrayBuffer | Blob | File,
  onProgress?: (msg: string) => void
): Promise<Float32Array> {
  onProgress?.('Decoding audio stream via Web Audio API...');
  const arrayBuffer = audioData instanceof ArrayBuffer ? audioData : await audioData.arrayBuffer();

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioCtx();
  const decoded = await tempCtx.decodeAudioData(arrayBuffer);
  await tempCtx.close();

  onProgress?.(`Resampling ${decoded.duration.toFixed(1)}s audio to 22,050Hz...`);
  const targetLength = Math.round(decoded.duration * TARGET_SR);
  const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SR);

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;

  // Clean universal downmix with a 45Hz highpass filter:
  // OfflineAudioContext(1, ...) downmixes all channels cleanly (M = 0.5 * (L + R) for stereo)
  // 45Hz highpass removes sub-rumble without attenuating bass or piano fundamentals
  const highpass = offlineCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 45;
  highpass.Q.value = 0.707;

  source.connect(highpass);
  highpass.connect(offlineCtx.destination);

  source.start(0);

  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

function getDiatonicIndices(tonic: string, mode: 'major' | 'minor'): Set<number> {
  const rootIdx = PITCH_NAMES.indexOf(tonic);
  if (rootIdx < 0) return new Set();

  const set = new Set<number>();
  if (mode === 'major') {
    const offsets = [
      { semi: 0, minor: false }, // I
      { semi: 2, minor: true },  // ii
      { semi: 4, minor: true },  // iii
      { semi: 5, minor: false }, // IV
      { semi: 7, minor: false }, // V
      { semi: 9, minor: true },  // vi
    ];
    for (const { semi, minor } of offsets) {
      const pitch = PITCH_NAMES[(rootIdx + semi) % 12];
      const chord = minor ? `${pitch}m` : pitch;
      const idx = BTC_LABELS.indexOf(chord);
      if (idx >= 0) set.add(idx);
    }
  } else {
    const offsets = [
      { semi: 0, minor: true },  // i
      { semi: 3, minor: false }, // III
      { semi: 5, minor: true },  // iv
      { semi: 7, minor: true },  // v
      { semi: 7, minor: false }, // V
      { semi: 8, minor: false }, // VI
      { semi: 10, minor: false },// VII
    ];
    for (const { semi, minor } of offsets) {
      const pitch = PITCH_NAMES[(rootIdx + semi) % 12];
      const chord = minor ? `${pitch}m` : pitch;
      const idx = BTC_LABELS.indexOf(chord);
      if (idx >= 0) set.add(idx);
    }
  }
  return set;
}

function estimateKeyFromChromagram(chroma: number[]): { key: string; tonic: string; mode: 'major' | 'minor' } {
  let bestScore = -Infinity;
  let bestTonic = 'C';
  let bestMode: 'major' | 'minor' = 'major';

  for (let root = 0; root < 12; root++) {
    let majDot = 0;
    let minDot = 0;
    for (let i = 0; i < 12; i++) {
      const pitch = (root + i) % 12;
      majDot += chroma[pitch] * MAJOR_PROFILE[i];
      minDot += chroma[pitch] * MINOR_PROFILE[i];
    }
    if (majDot > bestScore) {
      bestScore = majDot;
      bestTonic = PITCH_NAMES[root];
      bestMode = 'major';
    }
    if (minDot > bestScore) {
      bestScore = minDot;
      bestTonic = PITCH_NAMES[root];
      bestMode = 'minor';
    }
  }

  return {
    key: `${bestTonic} ${bestMode === 'major' ? 'Major' : 'Minor'}`,
    tonic: bestTonic,
    mode: bestMode,
  };
}

function parseChordDetails(chord: string): { root: string; quality: string; bass?: string } {
  if (!chord || chord === 'N.C.' || chord === 'N') {
    return { root: 'N.C.', quality: '' };
  }
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { root: chord, quality: '' };
  return { root: match[1], quality: match[2] || '' };
}

/**
 * 100% In-Browser Chord Analysis using Rust WebAssembly + WebGPU ONNX.
 */
export async function analyzeAudioClientSide(
  pcm: Float32Array,
  meta: { title: string; artist?: string; videoId?: string },
  onProgress?: (step: string) => void
): Promise<SongAnalysisResponse> {
  const t0 = performance.now();
  onProgress?.('Initializing Rust WebAssembly CQT engine...');
  const cqt = await getEngine();
  const session = await getOnnxSession();

  // 1. Rust SIMD CQT
  const totalFrames = 1 + Math.floor(pcm.length / HOP);
  onProgress?.(`Computing 144-bin CQT via Rust Wasm (${totalFrames} frames)...`);
  const cqtFlat = cqt.compute_cqt(pcm);
  console.log(`[localAnalyzer] Rust Wasm CQT finished in ${(performance.now() - t0).toFixed(0)}ms`);

  // 2. 50% Overlapping inference
  const OVERLAP_STEP = Math.floor(TIMESTEP / 2); // 54 frames
  const probSum = new Float32Array(totalFrames * 25);
  const frameCover = new Uint16Array(totalFrames);

  onProgress?.('Running neural transformer in browser (WebGPU/Wasm)...');
  const tInfer = performance.now();

  for (let start = 0; start < totalFrames; start += OVERLAP_STEP) {
    const end = Math.min(start + TIMESTEP, totalFrames);
    const frameCount = end - start;

    const inputData = new Float32Array(TIMESTEP * N_BINS);
    inputData.set(cqtFlat.subarray(start * N_BINS, end * N_BINS));

    const tensor = new ort.Tensor('float32', inputData, [1, TIMESTEP, N_BINS]);
    const out = await session.run({ cqt: tensor });
    const logits = out.logits.data as Float32Array;

    for (let i = 0; i < frameCount; i++) {
      const f = start + i;
      let maxLogit = logits[i * 25 + 0];
      for (let c = 1; c < 25; c++) {
        const val = logits[i * 25 + c];
        if (val > maxLogit) maxLogit = val;
      }

      let expSum = 0;
      for (let c = 0; c < 25; c++) {
        expSum += Math.exp(logits[i * 25 + c] - maxLogit);
      }
      const invExpSum = expSum > 0 ? 1 / expSum : 0;
      for (let c = 0; c < 25; c++) {
        const p = Math.exp(logits[i * 25 + c] - maxLogit) * invExpSum;
        probSum[f * 25 + c] += p;
      }
      frameCover[f]++;
    }

    if (end >= totalFrames) break;
  }
  console.log(`[localAnalyzer] In-browser inference finished in ${(performance.now() - tInfer).toFixed(0)}ms`);

  // 3. Average & Gaussian temporal smoothing
  const avgProbs = new Float32Array(totalFrames * 25);
  for (let f = 0; f < totalFrames; f++) {
    const cCount = frameCover[f] || 1;
    for (let c = 0; c < 25; c++) {
      avgProbs[f * 25 + c] = probSum[f * 25 + c] / cCount;
    }
  }

  const smoothedProbs = new Float32Array(totalFrames * 25);
  for (let f = 0; f < totalFrames; f++) {
    const prev = Math.max(0, f - 1);
    const next = Math.min(totalFrames - 1, f + 1);
    for (let c = 0; c < 25; c++) {
      smoothedProbs[f * 25 + c] =
        0.15 * avgProbs[prev * 25 + c] +
        0.70 * avgProbs[f * 25 + c] +
        0.15 * avgProbs[next * 25 + c];
    }
  }

  // 4. Chroma energy for Key estimation
  const chromaSum = new Array(12).fill(0);
  for (let f = 0; f < totalFrames; f++) {
    for (let c = 0; c < 24; c++) {
      const pitch = Math.floor(c / 2);
      chromaSum[pitch] += smoothedProbs[f * 25 + c];
    }
  }
  const keyInfo = estimateKeyFromChromagram(chromaSum);
  const diatonicSet = getDiatonicIndices(keyInfo.tonic, keyInfo.mode);

  // 5. Final chord classification with gentle harmonic prior
  onProgress?.('Aligning chord progression timeline...');
  const frames: { t: number; label: string; confidence: number }[] = [];
  for (let f = 0; f < totalFrames; f++) {
    let best = 0;
    let bestScore = -1;
    for (let c = 0; c < 25; c++) {
      let p = smoothedProbs[f * 25 + c];
      // Gentle diatonic prior (does not suppress legitimate non-diatonic chords like minor iv in Creep)
      if (diatonicSet.has(c)) {
        p *= 1.1;
      }
      if (p > bestScore) {
        bestScore = p;
        best = c;
      }
    }
    frames.push({
      t: f * FRAME_SEC,
      label: BTC_LABELS[best],
      confidence: smoothedProbs[f * 25 + best],
    });
  }

  // 6. Merge frames into segments with duration smoothing
  // Fast-changing chords (>= 0.20s) and non-diatonic chords are fully preserved
  const minSeg = 0.20; // Allows fast chord transitions
  const rawSegments: { startT: number; endT: number; label: string; confidence: number }[] = [];
  let runStart = 0;

  for (let i = 1; i <= frames.length; i++) {
    const broke = i === frames.length || frames[i].label !== frames[runStart].label;
    if (broke) {
      const label = frames[runStart].label;
      if (label !== 'N') {
        const confs: number[] = [];
        for (let j = runStart; j < i; j++) confs.push(frames[j].confidence);
        confs.sort((a, b) => a - b);
        const trim = Math.floor(confs.length * 0.25);
        const trimmed = confs.slice(trim);
        const avgConf = trimmed.reduce((a, b) => a + b, 0) / (trimmed.length || 1);

        rawSegments.push({
          startT: frames[runStart].t,
          endT: frames[i - 1].t + FRAME_SEC,
          label,
          confidence: avgConf,
        });
      }
      runStart = i;
    }
  }

  // Coalesce segments without hard-deleting non-diatonic or low-confidence chords
  const coalesced: typeof rawSegments = [];
  for (const seg of rawSegments) {
    const last = coalesced[coalesced.length - 1];
    if (last && last.label === seg.label) {
      last.endT = seg.endT;
      last.confidence = Math.max(last.confidence, seg.confidence);
    } else if (seg.endT - seg.startT >= minSeg || !last) {
      coalesced.push({ ...seg });
    } else {
      // For ultra-short micro glitches (<0.20s), bridge into adjacent chord
      last.endT = seg.endT;
    }
  }

  // 7. Estimate BPM
  const durations: number[] = [];
  for (let i = 1; i < coalesced.length; i++) {
    const diff = coalesced[i].startT - coalesced[i - 1].startT;
    if (diff >= 0.8 && diff <= 6.0) durations.push(diff);
  }
  durations.sort((a, b) => a - b);
  const medianDur = durations[Math.floor(durations.length / 2)] || 2.0;
  let bpm = Math.round((60 / medianDur) * 2);
  while (bpm < 65) bpm *= 2;
  while (bpm > 165) bpm = Math.round(bpm / 2);

  const chords: ChordSegment[] = coalesced.map((s, idx) => {
    const parsed = parseChordDetails(s.label);
    return {
      id: `c_${idx}_${Math.round(s.startT * 10)}`,
      startTime: Math.round(s.startT * 100) / 100,
      endTime: Math.round(s.endT * 100) / 100,
      chord: s.label,
      root: parsed.root,
      quality: parsed.quality,
      confidence: Math.round(s.confidence * 100) / 100,
    };
  });

  console.log(`[localAnalyzer] Done: ${chords.length} chords in ${((performance.now() - t0) / 1000).toFixed(2)}s`);

  return {
    videoId: meta.videoId || 'local-file',
    title: meta.title,
    artist: meta.artist || 'Local Audio (Rust Wasm)',
    bpm,
    key: keyInfo.key,
    timeSignature: '4/4',
    suggestedCapo: 0,
    chords,
  };
}
