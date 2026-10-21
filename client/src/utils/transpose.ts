const NOTES_SHARP: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT: string[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

// Keys that conventionally use flats in their key signatures
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

/**
 * Parse a chord symbol into root, quality, and optional bass note.
 * E.g., "F#m7/C#" -> { root: "F#", quality: "m7", bass: "C#" }
 */
export function parseChord(chordStr: string): { root: string; quality: string; bass?: string } | null {
  if (!chordStr || chordStr === 'N.C.' || chordStr === 'NC') return null;

  const trimmed = chordStr.trim();
  if (trimmed.length === 0) return null;

  // Handle slash chords: split on '/' but only if the part after '/' looks like a note
  let main = trimmed;
  let bass: string | undefined;

  const slashIdx = trimmed.lastIndexOf('/');
  if (slashIdx > 0 && slashIdx < trimmed.length - 1) {
    const afterSlash = trimmed.slice(slashIdx + 1);
    // Check if the part after slash starts with a valid note letter
    if (/^[A-G]/.test(afterSlash)) {
      bass = afterSlash;
      main = trimmed.slice(0, slashIdx);
    }
  }

  // Parse root note: first character must be A-G, optional # or b
  const match = main.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;

  const root = match[1];
  const quality = match[2] || '';

  // Validate root exists in our lookup
  if (NOTE_TO_INDEX[root] === undefined) return null;

  return { root, quality, bass };
}

export type AccidentalPreference = 'sharp' | 'flat';

/**
 * Explicitly convert a chord symbol to use sharps or flats.
 * E.g., convertAccidental("A#", "flat") -> "Bb"
 * E.g., convertAccidental("Db", "sharp") -> "C#"
 * E.g., convertAccidental("G#m/D#", "flat") -> "Abm/Eb"
 */
export function convertAccidental(chord: string, target: AccidentalPreference): string {
  if (!chord || chord === 'N.C.' || chord === 'NC') return chord;
  const parsed = parseChord(chord);
  if (!parsed) return chord;

  const rootIndex = NOTE_TO_INDEX[parsed.root];
  if (rootIndex === undefined) return chord;
  const newRoot = target === 'flat' ? NOTES_FLAT[rootIndex] : NOTES_SHARP[rootIndex];
  let result = newRoot + parsed.quality;

  if (parsed.bass) {
    const bassIndex = NOTE_TO_INDEX[parsed.bass];
    if (bassIndex !== undefined) {
      const newBass = target === 'flat' ? NOTES_FLAT[bassIndex] : NOTES_SHARP[bassIndex];
      result += '/' + newBass;
    }
  }
  return result;
}

/**
 * Transpose a single note by N semitones.
 */
function transposeNote(note: string, semitones: number, preferFlats: boolean): string {
  const index = NOTE_TO_INDEX[note];
  if (index === undefined) return note;

  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return preferFlats ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
}

/**
 * Determine whether to use flats based on the original note and musical context.
 */
function shouldPreferFlats(root: string): boolean {
  // If the original note was a flat, keep using flats
  if (root.includes('b')) return true;
  // If it's a key that conventionally uses flats
  if (FLAT_KEYS.has(root)) return true;
  return false;
}

/**
 * Transpose a full chord symbol by N semitones with optional accidental override.
 * Handles slash chords, sharps, flats, and complex qualities.
 * 
 * @example
 * transposeChord('C', 2)                   // -> 'D'
 * transposeChord('A#', 0, 'flat')          // -> 'Bb'
 * transposeChord('Am7', 3, 'sharp')        // -> 'C#m7' (or 'Cm7')
 */
export function transposeChord(
  chord: string,
  semitones: number,
  accidentalPreference?: AccidentalPreference
): string {
  if (chord === 'N.C.' || chord === 'NC' || !chord) return chord;
  if (semitones === 0) {
    if (accidentalPreference) {
      return convertAccidental(chord, accidentalPreference);
    }
    return chord;
  }

  const parsed = parseChord(chord);
  if (!parsed) return chord;

  const preferFlats = accidentalPreference !== undefined
    ? accidentalPreference === 'flat'
    : shouldPreferFlats(parsed.root);

  const newRoot = transposeNote(parsed.root, semitones, preferFlats);
  let result = newRoot + parsed.quality;

  if (parsed.bass) {
    const bassPreferFlats = accidentalPreference !== undefined
      ? accidentalPreference === 'flat'
      : shouldPreferFlats(parsed.bass);
    const newBass = transposeNote(parsed.bass, semitones, bassPreferFlats);
    result += '/' + newBass;
  }

  return result;
}

/**
 * Transpose an entire array of ChordSegments by N semitones with optional accidental preference.
 */
export function transposeChords(
  chords: { chord: string; root: string; bass?: string; [key: string]: unknown }[],
  semitones: number,
  accidentalPreference?: AccidentalPreference
): typeof chords {
  return chords.map((seg) => {
    const transposedChord = transposeChord(seg.chord, semitones, accidentalPreference);
    const parsed = parseChord(transposedChord);
    return {
      ...seg,
      chord: transposedChord,
      root: parsed?.root ?? seg.root,
      bass: parsed?.bass ?? seg.bass,
    };
  });
}

/**
 * Calculate the effective chords when using a capo.
 * If you capo at fret N, the sounding chords are the originals,
 * but the SHAPES you play are transposed DOWN by N semitones.
 */
export function getCapoChords(
  chords: { chord: string; root: string; [key: string]: unknown }[],
  capoFret: number,
  accidentalPreference?: AccidentalPreference
): typeof chords {
  if (capoFret === 0) {
    if (accidentalPreference) {
      return transposeChords(chords, 0, accidentalPreference) as typeof chords;
    }
    return chords;
  }
  return transposeChords(chords, -capoFret, accidentalPreference) as typeof chords;
}

/**
 * Format a chord for display, e.g., split root and quality for styling.
 */
export function formatChordDisplay(
  chord: string,
  accidentalPreference?: AccidentalPreference
): { root: string; quality: string; bass?: string } {
  const adjustedChord = accidentalPreference ? convertAccidental(chord, accidentalPreference) : chord;
  const parsed = parseChord(adjustedChord);
  if (!parsed) return { root: adjustedChord, quality: '' };
  return parsed;
}
