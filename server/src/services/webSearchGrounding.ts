import { searchTabChords, transposeChord, standardizeChord, type TabGrounding } from './tabRetriever.js';
import type { VideoMetadata } from '../types/index.js';

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CHORD_NOTES: Record<string, number[]> = {
  // Major triads: root, +4, +7
  'C': [0, 4, 7], 'C#': [1, 5, 8], 'Db': [1, 5, 8], 'D': [2, 6, 9], 'D#': [3, 7, 10], 'Eb': [3, 7, 10],
  'E': [4, 8, 11], 'F': [5, 9, 0], 'F#': [6, 10, 1], 'Gb': [6, 10, 1], 'G': [7, 11, 2], 'G#': [8, 0, 3],
  'Ab': [8, 0, 3], 'A': [9, 1, 4], 'A#': [10, 2, 5], 'Bb': [10, 2, 5], 'B': [11, 3, 6],
  // Minor triads: root, +3, +7
  'Cm': [0, 3, 7], 'C#m': [1, 4, 8], 'Dbm': [1, 4, 8], 'Dm': [2, 5, 9], 'D#m': [3, 6, 10], 'Ebm': [3, 6, 10],
  'Em': [4, 7, 11], 'Fm': [5, 8, 0], 'F#m': [6, 9, 1], 'Gbm': [6, 9, 1], 'Gm': [7, 10, 2], 'G#m': [8, 11, 3],
  'Abm': [8, 11, 3], 'Am': [9, 0, 4], 'A#m': [10, 1, 5], 'Bbm': [10, 1, 5], 'Bm': [11, 2, 6],
};

/**
 * Computes a 12-element normalized chroma energy vector from BTC CQT data.
 */
export function computeChromaFromCqt(cqtData: Float32Array, totalFrames: number): Float32Array {
  const chroma = new Float32Array(12);
  for (let f = 0; f < totalFrames; f++) {
    for (let b = 0; b < 144; b++) {
      const semitone = Math.floor(b / 2) % 12;
      const mag = Math.exp(cqtData[f * 144 + b]);
      chroma[semitone] += mag;
    }
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += chroma[i];
  if (sum > 0) {
    for (let i = 0; i < 12; i++) chroma[i] /= sum;
  }
  return chroma;
}

/**
 * Validates web-scraped chords against physical audio CQT frequencies.
 * Detects whether the audio is shifted relative to the tab (e.g. Capo discrepancy or alternate tuning).
 * Returns the sounding chords aligned to the actual audio.
 */
export function validateCapoAgainstAudio(
  tab: TabGrounding,
  audioChroma: Float32Array
): {
  validatedChords: string[];
  soundingKey?: string;
  capoShift: number;
  confidence: number;
} {
  if (!tab.verifiedChords || tab.verifiedChords.length === 0) {
    return {
      validatedChords: [],
      soundingKey: tab.key,
      capoShift: 0,
      confidence: 0,
    };
  }

  // Build expected pitch profile for the tab's chords
  const expectedProfile = new Float32Array(12);
  for (const chord of tab.verifiedChords) {
    const clean = chord.replace(/[\/\(].*$/, '');
    const notes = CHORD_NOTES[clean];
    if (notes) {
      for (const n of notes) {
        expectedProfile[n] += 1.0;
      }
    } else {
      const match = clean.match(/^([A-G][#b]?)/);
      if (match) {
        const pc = PITCH_NAMES.indexOf(match[1]);
        if (pc >= 0) expectedProfile[pc] += 1.0;
      }
    }
  }

  let expSum = 0;
  for (let i = 0; i < 12; i++) expSum += expectedProfile[i];
  if (expSum > 0) {
    for (let i = 0; i < 12; i++) expectedProfile[i] /= expSum;
  }

  // Cross-correlate expected profile across all 12 semitone shifts against physical audio chroma
  let bestShift = 0;
  let maxScore = -1;
  const scores: number[] = [];

  for (let s = 0; s < 12; s++) {
    let score = 0;
    for (let pc = 0; pc < 12; pc++) {
      const shiftedPc = (pc + s) % 12;
      score += expectedProfile[pc] * audioChroma[shiftedPc];
    }
    scores.push(score);
    if (score > maxScore) {
      maxScore = score;
      bestShift = s;
    }
  }

  console.log(`[webGrounding] Capo cross-correlation: best shift = +${bestShift} semitones (score: ${maxScore.toFixed(4)})`);

  if (bestShift === 0) {
    console.log(`[webGrounding] Audio CQT confirmed: tab matches physical sounding concert key perfectly.`);
    return {
      validatedChords: tab.verifiedChords,
      soundingKey: tab.key,
      capoShift: 0,
      confidence: maxScore,
    };
  }

  // Capo discrepancy detected: The live audio is shifted by +bestShift semitones relative to tab
  console.log(`[webGrounding] Capo discrepancy detected! Audio is played +${bestShift} semitones higher than tab. Transposing chords to true sounding concert pitch...`);
  const shiftedChords = tab.verifiedChords.map((c) => transposeChord(c, bestShift));
  const shiftedKey = tab.key ? transposeChord(tab.key.split(' ')[0], bestShift) + (tab.key.includes(' ') ? ' ' + tab.key.split(' ').slice(1).join(' ') : '') : undefined;

  return {
    validatedChords: shiftedChords,
    soundingKey: shiftedKey,
    capoShift: bestShift,
    confidence: maxScore,
  };
}

/**
 * Searches the web for verified chord tabs and validates them against the audio recording.
 */
export async function getVerifiedWebGrounding(
  metadata?: VideoMetadata,
  audioChroma?: Float32Array,
  customApiKey?: string
): Promise<TabGrounding | null> {
  if (!metadata?.title) return null;

  try {
    const rawTab = await searchTabChords(metadata.title, metadata.artist);
    if (!rawTab) return null;

    if (audioChroma && rawTab.verifiedChords && rawTab.verifiedChords.length > 0) {
      const validation = validateCapoAgainstAudio(rawTab, audioChroma);
      return {
        ...rawTab,
        verifiedChords: validation.validatedChords,
        key: validation.soundingKey || rawTab.key,
        capo: rawTab.capo,
      };
    }

    return rawTab;
  } catch (err) {
    console.warn('[webGrounding] Web grounding lookup skipped:', err instanceof Error ? err.message : err);
    return null;
  }
}
