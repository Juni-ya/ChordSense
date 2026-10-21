import ffmpeg from 'ffmpeg-static';
import fsSync from 'fs';
import ort from 'onnxruntime-node';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Cqt, BTC_CQT } from './btc/cqt.js';
import { buildSegments, keyFromSegments, NO_CHORD } from './btc/chord-decode.js';
import type { ChordSegment, SongAnalysisResponse, VideoMetadata } from '../types/index.js';
import type { TabGrounding } from './tabRetriever.js';

const TARGET_SR = 22050;
const HOP = 2048;
const N_BINS = 144;
const TIMESTEP = 108; // BTC instance length (~10s)
const FRAME_SEC = HOP / TARGET_SR; // ~0.09288s

/** BTC 25-class vocab (idx2chord) → standard display labels. */
const BTC_LABELS = [
  'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em',
  'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am',
  'A#', 'A#m', 'B', 'Bm', NO_CHORD,
];

let sessionMemo: ort.InferenceSession | null = null;

async function getBtcSession(): Promise<ort.InferenceSession> {
  if (sessionMemo) return sessionMemo;
  let modelPath = path.resolve('models/btc.onnx');
  if (!fsSync.existsSync(modelPath)) {
    modelPath = path.resolve(process.cwd(), 'server/models/btc.onnx');
  }
  console.log(`[btcAnalyzer] Loading BTC model from ${modelPath}...`);
  sessionMemo = await ort.InferenceSession.create(modelPath);
  console.log('[btcAnalyzer] BTC model loaded successfully.');
  return sessionMemo;
}

/**
 * Decodes any audio file (m4a, mp3, wav, etc.) to 22,050Hz mono 32-bit float PCM.
 * Applies Universal Mastering Acoustic Preprocessor:
 * 1. highpass=f=45: cuts sub-audible 30Hz stage rumble & 808 sub-distortion without cutting piano left-hand roots (C2 = 65Hz) or guitar low E (82Hz).
 * 2. loudnorm=I=-16:TP=-1.5:LRA=11: normalizes dynamic range so quiet piano ballads and loud compressed EDM tracks have equal signal-to-noise ratio.
 * 3. aformat=channel_layouts=mono: leaves stereo phase intact before mono summing.
 */
function decodeAudioToPCM(audioPath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    if (!ffmpeg) {
      return reject(new Error('ffmpeg binary not found in ffmpeg-static'));
    }

    const universalFilter = 'highpass=f=45,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=channel_layouts=mono';

    const args = [
      '-i', audioPath,
      '-af', universalFilter,
      '-ar', String(TARGET_SR),
      '-ac', '1',
      '-f', 'f32le',
      '-v', 'quiet',
      'pipe:1',
    ];

    const proc = spawn(ffmpeg, args);
    const chunks: Buffer[] = [];

    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on('data', (err: Buffer) => console.error('[btcAnalyzer] ffmpeg stderr:', err.toString()));
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`));
      const buffer = Buffer.concat(chunks);
      const floatArray = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
      );
      resolve(floatArray);
    });
    proc.on('error', reject);
  });
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
 * Estimates BPM from chord transition intervals and harmonic rhythm.
 */
function estimateBpmFromSegments(segments: { startT: number; endT: number }[]): number {
  if (segments.length < 3) return 120;
  const durations: number[] = [];
  for (let i = 1; i < segments.length; i++) {
    const diff = segments[i].startT - segments[i - 1].startT;
    if (diff >= 0.8 && diff <= 6.0) {
      durations.push(diff);
    }
  }
  if (durations.length === 0) return 120;
  durations.sort((a, b) => a - b);
  const medianDuration = durations[Math.floor(durations.length / 2)];
  
  // Median chord dwell is typically 2 beats or 4 beats (1 measure)
  // At 120 BPM in 4/4: 1 beat = 0.5s, 2 beats = 1.0s, 4 beats = 2.0s
  let bpm = Math.round((60 / medianDuration) * 2);
  while (bpm < 65) bpm *= 2;
  while (bpm > 165) bpm = Math.round(bpm / 2);
  return bpm;
}

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getDiatonicIndices(tonic: string, mode: 'major' | 'minor'): Set<number> {
  const rootIdx = PITCH_NAMES.indexOf(tonic);
  if (rootIdx < 0) return new Set();

  const set = new Set<number>();
  if (mode === 'major') {
    // I, ii, iii, IV, V, vi
    const offsets = [
      { semi: 0, minor: false },
      { semi: 2, minor: true },
      { semi: 4, minor: true },
      { semi: 5, minor: false },
      { semi: 7, minor: false },
      { semi: 9, minor: true },
    ];
    for (const { semi, minor } of offsets) {
      const pitch = PITCH_NAMES[(rootIdx + semi) % 12];
      const chordLabel = minor ? `${pitch}m` : pitch;
      const btcIdx = BTC_LABELS.indexOf(chordLabel);
      if (btcIdx >= 0) set.add(btcIdx);
    }
  } else {
    // i, III, iv, v, V, VI, VII
    const offsets = [
      { semi: 0, minor: true },
      { semi: 3, minor: false },
      { semi: 5, minor: true },
      { semi: 7, minor: true },
      { semi: 7, minor: false },
      { semi: 8, minor: false },
      { semi: 10, minor: false },
    ];
    for (const { semi, minor } of offsets) {
      const pitch = PITCH_NAMES[(rootIdx + semi) % 12];
      const chordLabel = minor ? `${pitch}m` : pitch;
      const btcIdx = BTC_LABELS.indexOf(chordLabel);
      if (btcIdx >= 0) set.add(btcIdx);
    }
  }
  return set;
}

/**
 * Analyzes an audio track using the pre-trained BTC Transformer model.
 * Deterministic, 100% offline, $0 API costs, sub-4-second inference.
 */
export async function analyzeWithBTC(
  audioPath: string,
  metadata?: VideoMetadata,
  tabGrounding?: TabGrounding | null
): Promise<SongAnalysisResponse> {
  const t0 = Date.now();
  console.log(`[btcAnalyzer] Starting offline BTC analysis for: ${audioPath}...`);

  // 1. Decode audio to 22,050Hz mono PCM
  const pcm = await decodeAudioToPCM(audioPath);
  console.log(`[btcAnalyzer] Decoded ${(pcm.length / TARGET_SR).toFixed(1)}s audio in ${Date.now() - t0}ms`);

  // 2. Load model
  const session = await getBtcSession();

  // 3. Compute CQT features
  const cqt = new Cqt(BTC_CQT);
  const totalFrames = 1 + Math.floor(pcm.length / HOP);
  console.log(`[btcAnalyzer] Computing CQT across ${totalFrames} frames...`);
  const { data: cqtData } = cqt.logCqt(pcm, 0);

  // 4. Run BTC Transformer with 50% overlapping windows
  // Overlap eliminates transformer boundary artifacts and provides bidirectional context
  const tInfer = Date.now();
  const OVERLAP_STEP = Math.floor(TIMESTEP / 2); // 54 frames (~5s hop)
  const probSum = new Float32Array(totalFrames * 25);
  const frameCoverCount = new Uint16Array(totalFrames);

  for (let start = 0; start < totalFrames; start += OVERLAP_STEP) {
    const end = Math.min(start + TIMESTEP, totalFrames);
    const frameCount = end - start;

    const input = new Float32Array(TIMESTEP * N_BINS);
    const slice = cqtData.slice(start * N_BINS, end * N_BINS);
    input.set(slice);

    const tensor = new ort.Tensor('float32', input, [1, TIMESTEP, N_BINS]);
    const out = await session.run({ cqt: tensor });
    const logits = out.logits.data as Float32Array;

    for (let i = 0; i < frameCount; i++) {
      const f = start + i;
      let maxLogit = logits[i * 25 + 0];
      for (let c = 1; c < 25; c++) {
        const val = logits[i * 25 + c];
        if (val > maxLogit) maxLogit = val;
      }

      // Softmax over all 25 classes
      let expSum = 0;
      for (let c = 0; c < 25; c++) {
        expSum += Math.exp(logits[i * 25 + c] - maxLogit);
      }
      const invExpSum = expSum > 0 ? 1 / expSum : 0;
      for (let c = 0; c < 25; c++) {
        const p = Math.exp(logits[i * 25 + c] - maxLogit) * invExpSum;
        probSum[f * 25 + c] += p;
      }
      frameCoverCount[f]++;
    }

    if (end >= totalFrames) break;
  }

  console.log(`[btcAnalyzer] Overlapping BTC inference finished in ${Date.now() - tInfer}ms`);

  // Average probabilities across overlapping windows
  const avgProbs = new Float32Array(totalFrames * 25);
  for (let f = 0; f < totalFrames; f++) {
    const count = frameCoverCount[f] || 1;
    const invCount = 1 / count;
    for (let c = 0; c < 25; c++) {
      avgProbs[f * 25 + c] = probSum[f * 25 + c] * invCount;
    }
  }

  // Temporal Gaussian smoothing (3-point kernel [0.15, 0.70, 0.15])
  // Suppresses transient drum spikes (snare/kick) that momentarily destabilize logits in fast songs
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

  // 5. Pass 1: Initial decode for global key and tempo
  const pass1Frames = [];
  for (let f = 0; f < totalFrames; f++) {
    let best = 0;
    for (let c = 1; c < 25; c++) {
      if (smoothedProbs[f * 25 + c] > smoothedProbs[f * 25 + best]) best = c;
    }
    pass1Frames.push({
      t: f * FRAME_SEC,
      label: BTC_LABELS[best],
      confidence: smoothedProbs[f * 25 + best],
    });
  }

  const prelimSegments = buildSegments(pass1Frames, FRAME_SEC, 0.35);
  const keySig = keyFromSegments(prelimSegments);
  const detectedKey = tabGrounding?.key || (keySig ? `${keySig.tonic} ${keySig.mode === 'major' ? 'Major' : 'Minor'}` : 'C Major');
  const suggestedCapo = tabGrounding?.capo ?? 0;
  const bpm = estimateBpmFromSegments(prelimSegments);

  // Build diatonic prior set for the detected key
  const keyParts = detectedKey.split(' ');
  const tonic = keyParts[0];
  const mode = (keyParts[1] || 'Major').toLowerCase().includes('min') ? 'minor' : 'major';
  const diatonicIndices = getDiatonicIndices(tonic, mode);

  const groundIndices = new Set<number>();
  const groundChordNames = new Set<string>();
  if (tabGrounding?.verifiedChords && tabGrounding.verifiedChords.length > 0) {
    for (const vc of tabGrounding.verifiedChords) {
      groundChordNames.add(vc);
      const idx = BTC_LABELS.indexOf(vc);
      if (idx >= 0) {
        groundIndices.add(idx);
        diatonicIndices.add(idx);
      }
    }
  }

  // 6. Pass 2: Diatonic & Tab-guided final decode
  // When verified chords are known from Ultimate-Guitar tab grounding (e.g. G, B, C, Cm for Creep):
  // We apply Bayesian logit/probability weighting:
  // - Verified song chords (groundIndices) get boosted (2.40x).
  // - In-key diatonic chords (diatonicIndices) get 1.15x.
  // - Non-grounded, non-diatonic chords (out-of-key bass transient notes) get attenuated (0.35x).
  const hasGrounding = groundIndices.size > 0;
  const finalFrames = [];
  for (let f = 0; f < totalFrames; f++) {
    let best = 0;
    let bestScore = -1;

    for (let c = 0; c < 25; c++) {
      let p = smoothedProbs[f * 25 + c];
      if (hasGrounding) {
        if (groundIndices.has(c)) {
          p *= 2.40;
        } else if (diatonicIndices.has(c)) {
          p *= 1.15;
        } else {
          p *= 0.40;
        }
      } else {
        if (diatonicIndices.has(c)) {
          p *= 1.35;
        } else {
          p *= 0.65;
        }
      }

      if (p > bestScore) {
        bestScore = p;
        best = c;
      }
    }

    finalFrames.push({
      t: f * FRAME_SEC,
      label: BTC_LABELS[best],
      confidence: smoothedProbs[f * 25 + best],
    });
  }

  // Adaptive metric segment length:
  // Allow chords as fast as 1 musical beat:
  const beatSec = 60 / Math.max(50, Math.min(220, bpm));
  const minSeg = Math.max(0.35, Math.min(0.60, beatSec * 0.75));
  const rawSegments = buildSegments(finalFrames, FRAME_SEC, minSeg, groundChordNames, bpm);

  const chords: ChordSegment[] = rawSegments.map((s) => {
    const chordLabel = s.label === NO_CHORD ? 'N.C.' : s.label;
    const parsed = parseChordDetails(chordLabel);
    return {
      id: uuidv4(),
      startTime: Math.round(s.startT * 100) / 100,
      endTime: Math.round(s.endT * 100) / 100,
      chord: chordLabel,
      root: parsed.root,
      quality: parsed.quality,
      confidence: Math.round(s.confidence * 100) / 100,
    };
  });

  console.log(`[btcAnalyzer] Result: Key ${detectedKey}, Capo ${suggestedCapo}, ${chords.length} chords detected`);

  return {
    videoId: metadata?.videoId || 'unknown',
    title: metadata?.title || 'Unknown Title',
    artist: metadata?.artist,
    bpm,
    key: detectedKey,
    timeSignature: '4/4',
    suggestedCapo,
    chords,
    engine: 'btc',
  };
}
