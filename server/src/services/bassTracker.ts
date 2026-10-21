import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';

const TARGET_SR = 5512; // High-efficiency sample rate for bass fundamentals (30Hz - 250Hz)

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Converts a fundamental frequency (Hz) to a pitch class name (e.g. 65Hz -> "C").
 */
function freqToPitchClass(freq: number): string | null {
  if (freq < 30 || freq > 320) return null;
  // MIDI note formula: 69 + 12 * log2(freq / 440)
  const midi = 69 + 12 * (Math.log(freq / 440) / Math.LN2);
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  return NOTE_NAMES[noteIndex];
}

/**
 * Decodes the isolated bass stem to low-rate PCM mono.
 * Low-pass filtered at 260Hz to isolate only the lowest fundamentals.
 */
export function decodeBassStem(bassAudioPath: string): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    if (!ffmpeg) return reject(new Error('ffmpeg-static binary not found'));

    const args = [
      '-i', bassAudioPath,
      '-af', 'lowpass=f=260,highpass=f=32,aformat=channel_layouts=mono',
      '-ar', String(TARGET_SR),
      '-ac', '1',
      '-f', 'f32le',
      '-v', 'quiet',
      'pipe:1',
    ];

    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];

    child.stdout.on('data', (c: Buffer) => chunks.push(c));
    child.on('close', (code) => {
      if (code === 0) {
        const full = Buffer.concat(chunks);
        resolve(new Float32Array(full.buffer, full.byteOffset, full.byteLength / 4));
      } else {
        reject(new Error(`Failed to decode bass stem, code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

/**
 * Estimates the dominant bass pitch in a given time interval using Normalized Autocorrelation.
 */
export function detectBassNoteInInterval(
  pcm: Float32Array,
  startTimeSec: number,
  endTimeSec: number
): string | null {
  const startSample = Math.max(0, Math.floor(startTimeSec * TARGET_SR));
  const endSample = Math.min(pcm.length, Math.floor(endTimeSec * TARGET_SR));
  const length = endSample - startSample;

  if (length < TARGET_SR * 0.2) return null; // Need at least 200ms

  // Search period corresponding to 35Hz (lag ~157) to 220Hz (lag ~25)
  const minLag = Math.floor(TARGET_SR / 220); // ~25
  const maxLag = Math.floor(TARGET_SR / 35);  // ~157

  let bestLag = -1;
  let maxCorr = -1;

  // Window energy
  let energy = 0;
  for (let i = startSample; i < endSample; i++) {
    energy += pcm[i] * pcm[i];
  }
  if (energy < 1e-4) return null; // Silence

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const count = length - lag;
    for (let i = 0; i < count; i++) {
      corr += pcm[startSample + i] * pcm[startSample + i + lag];
    }
    const normalized = corr / count;
    if (normalized > maxCorr) {
      maxCorr = normalized;
      bestLag = lag;
    }
  }

  if (bestLag > 0) {
    const fundamentalFreq = TARGET_SR / bestLag;
    return freqToPitchClass(fundamentalFreq);
  }

  return null;
}
