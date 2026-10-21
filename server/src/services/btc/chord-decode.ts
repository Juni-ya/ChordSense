/** Post-processing shared by chord detection: turn BTC's per-frame chord
 * labels into merged segments, estimate the key, and look up the chord under
 * the playhead.
 *
 * Pure, DOM-free — runs under `node --test` (see chord-decode.test.ts) and in
 * the panel. (BTC does the heavy lifting; this is just tidy-up + key.) */

export interface ChordSegment {
  startT: number;
  endT: number;
  label: string;
  confidence: number;
}

export interface KeySignature {
  tonic: string;
  mode: 'major' | 'minor';
  confidence: number;
}

export interface ChordChart {
  segments: ChordSegment[];
  key?: KeySignature | null;
  coverage?: number;
  analyzedFrom?: number;
  analyzedTo?: number;
  computedAt?: number;
}

export const PITCH_CLASS_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/** Display label for "no chord". Excluded from the rendered chart (blank span). */
export const NO_CHORD = 'N';

/** One time-tagged frame label from the model. */
export interface LabeledFrame {
  t: number;
  /** Display label ("C", "Cm", "F#", or NO_CHORD). */
  label: string;
  confidence?: number;
}

function computeSegmentConfidence(confs: number[]): number {
  if (confs.length === 0) return 0.88;
  if (confs.length <= 2) return Math.max(...confs);
  // Sort ascending
  const sorted = [...confs].sort((a, b) => a - b);
  // Drop the lowest 25% outliers (drum transient / pick attack noise)
  const trimStart = Math.floor(sorted.length * 0.25);
  const trimmed = sorted.slice(trimStart);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/** Merge consecutive equal-label frames into chord segments, dropping NO_CHORD
 * (blank) spans and breaking across time gaps (unanalyzed regions). Frames must
 * be time-ordered. */
export function buildSegments(
  frames: LabeledFrame[],
  frameSec: number,
  minSegmentSec = 0.5,
  groundChords?: Set<string>,
  bpm: number = 120,
): ChordSegment[] {
  if (frames.length === 0) return [];
  const gap = frameSec * 1.5;
  const raw: ChordSegment[] = [];
  let runStart = 0;
  for (let i = 1; i <= frames.length; i++) {
    const broke =
      i === frames.length ||
      frames[i].label !== frames[runStart].label ||
      frames[i].t - frames[i - 1].t > gap;
    if (broke) {
      const label = frames[runStart].label;
      if (label !== NO_CHORD) {
        const frameConfs: number[] = [];
        for (let j = runStart; j < i; j++) {
          frameConfs.push(frames[j].confidence ?? 0.88);
        }
        raw.push({
          startT: frames[runStart].t,
          endT: frames[i - 1].t + frameSec,
          label,
          confidence: computeSegmentConfidence(frameConfs),
        });
      }
      runStart = i;
    }
  }
  return coalesce(raw, minSegmentSec, groundChords, bpm);
}

/** Drop too-short segments and fuse touching same-label neighbors.
 * Uses metric duration thresholds to prevent 1-second passing bass blips. */
function coalesce(
  segments: ChordSegment[],
  minSeg: number,
  groundChords?: Set<string>,
  bpm: number = 120,
): ChordSegment[] {
  const beatSec = 60 / Math.max(50, Math.min(220, bpm));
  const minGroundSec = Math.max(0.30, beatSec * 0.60);
  const minNonGroundSec = Math.max(0.85, beatSec * 1.5);

  const out: ChordSegment[] = [];
  for (const seg of segments) {
    const isGround = groundChords && groundChords.size > 0 && groundChords.has(seg.label);
    const threshold = isGround ? minGroundSec : minNonGroundSec;
    const dur = seg.endT - seg.startT;

    if (dur < threshold) {
      const last = out[out.length - 1];
      if (last) {
        if (last.label === seg.label) {
          last.endT = seg.endT;
          last.confidence = Math.max(last.confidence, seg.confidence);
        } else {
          // Bridge across sub-threshold transient glitches (e.g. pick noise, bass slap)
          last.endT = seg.endT;
        }
      }
      continue;
    }
    const last = out[out.length - 1];
    if (last && last.label === seg.label && seg.startT - last.endT < minGroundSec) {
      last.confidence = Math.max(last.confidence, seg.confidence);
      last.endT = seg.endT;
    } else {
      out.push({ ...seg });
    }
  }
  return out;
}

/** Root pitch class + third/fifth for a display chord label. */
function chordTones(label: string): number[] | null {
  const minor = label.endsWith('m');
  const root = PITCH_CLASS_NAMES.indexOf((minor ? label.slice(0, -1) : label) as never);
  if (root < 0) return null;
  return [root, (root + (minor ? 3 : 4)) % 12, (root + 7) % 12];
}

/** Krumhansl–Kessler tonal hierarchy profiles. */
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Estimate the key from a 12-bin pitch-class weight profile (Krumhansl–
 * Schmuckler): Pearson-correlate against all 24 rotated key profiles. */
export function estimateKey(profile: number[] | Float64Array | Float32Array): KeySignature | null {
  let total = 0;
  for (let p = 0; p < 12; p++) total += profile[p];
  if (total < 1e-9) return null;

  let bestTonic = 0;
  let bestMode: 'major' | 'minor' = 'major';
  let bestCorr = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [prof, mode] of [
      [KK_MAJOR, 'major'],
      [KK_MINOR, 'minor'],
    ] as const) {
      const corr = pearsonRotated(profile, prof, tonic);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestTonic = tonic;
        bestMode = mode;
      }
    }
  }
  return { tonic: PITCH_CLASS_NAMES[bestTonic], mode: bestMode, confidence: Math.max(0, bestCorr) };
}

/** Build a pitch-class weight profile from chord segments (each chord's tones
 * weighted by its duration) and estimate the key. Robust and chroma-free. */
export function keyFromSegments(segments: ChordSegment[]): KeySignature | null {
  const profile = new Float64Array(12);
  for (const seg of segments) {
    const tones = chordTones(seg.label);
    if (!tones) continue;
    const dur = Math.max(0, seg.endT - seg.startT);
    // Root weighted a touch heavier than third/fifth.
    profile[tones[0]] += dur * 1.5;
    profile[tones[1]] += dur;
    profile[tones[2]] += dur;
  }
  return estimateKey(profile);
}

function pearsonRotated(
  x: number[] | Float64Array | Float32Array,
  profile: number[],
  tonic: number,
): number {
  let mx = 0;
  let my = 0;
  for (let p = 0; p < 12; p++) {
    mx += x[p];
    my += profile[p];
  }
  mx /= 12;
  my /= 12;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let p = 0; p < 12; p++) {
    const a = x[p] - mx;
    const b = profile[(p - tonic + 12) % 12] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom > 1e-9 ? num / denom : 0;
}

/** Chord whose segment contains `t` (binary search); null in a gap. */
export function chordAt(chart: ChordChart | null, t: number): ChordSegment | null {
  if (!chart) return null;
  const segs = chart.segments;
  let lo = 0;
  let hi = segs.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t < segs[mid].startT) hi = mid - 1;
    else if (t >= segs[mid].endT) lo = mid + 1;
    else return segs[mid];
  }
  return null;
}
