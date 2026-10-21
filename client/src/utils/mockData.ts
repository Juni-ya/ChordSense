import type { SongAnalysisResponse, ChordSegment } from '../types';

function seg(
  id: string,
  start: number,
  end: number,
  chord: string,
  root: string,
  quality: string,
  confidence: number,
  bass?: string
): ChordSegment {
  return { id, startTime: start, endTime: end, chord, root, quality, confidence, bass };
}

export const MOCK_ANALYSIS: SongAnalysisResponse = {
  videoId: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  artist: 'Rick Astley',
  bpm: 113,
  key: 'Ab Major',
  timeSignature: '4/4',
  suggestedCapo: 1,
  chords: [
    // Intro
    seg('c01', 0.0, 2.12, 'Ab', 'Ab', '', 0.92),
    seg('c02', 2.12, 4.25, 'Fm', 'F', 'm', 0.91),
    seg('c03', 4.25, 6.37, 'Db', 'Db', '', 0.93),
    seg('c04', 6.37, 8.50, 'Eb', 'Eb', '', 0.90),
    // Verse 1
    seg('c05', 8.50, 10.62, 'Ab', 'Ab', '', 0.95),
    seg('c06', 10.62, 12.74, 'Fm', 'F', 'm', 0.93),
    seg('c07', 12.74, 14.87, 'Db', 'Db', '', 0.94),
    seg('c08', 14.87, 17.0, 'Eb', 'Eb', '', 0.92),
    seg('c09', 17.0, 19.12, 'Ab', 'Ab', '', 0.96),
    seg('c10', 19.12, 21.24, 'Fm', 'F', 'm', 0.91),
    seg('c11', 21.24, 23.36, 'Db', 'Db', '', 0.93),
    seg('c12', 23.36, 25.49, 'Eb', 'Eb', '', 0.90),
    // Pre-Chorus
    seg('c13', 25.49, 27.61, 'Fm', 'F', 'm', 0.94),
    seg('c14', 27.61, 29.73, 'Eb', 'Eb', '', 0.92),
    seg('c15', 29.73, 31.86, 'Db', 'Db', '', 0.95),
    seg('c16', 31.86, 33.98, 'Eb', 'Eb', '', 0.91),
    // Chorus
    seg('c17', 33.98, 36.10, 'Ab', 'Ab', '', 0.97),
    seg('c18', 36.10, 38.23, 'Eb', 'Eb', '', 0.94),
    seg('c19', 38.23, 40.35, 'Fm', 'F', 'm', 0.93),
    seg('c20', 40.35, 42.48, 'Db', 'Db', '', 0.95),
    seg('c21', 42.48, 44.60, 'Ab', 'Ab', '', 0.96),
    seg('c22', 44.60, 46.73, 'Eb', 'Eb', '', 0.93),
    seg('c23', 46.73, 48.85, 'Fm', 'F', 'm', 0.91),
    seg('c24', 48.85, 50.97, 'Db', 'Db', '', 0.94),
    // Verse 2
    seg('c25', 50.97, 53.10, 'Ab', 'Ab', '', 0.95),
    seg('c26', 53.10, 55.22, 'Fm', 'F', 'm', 0.92),
    seg('c27', 55.22, 57.35, 'Db', 'Db', '', 0.93),
    seg('c28', 57.35, 59.47, 'Eb', 'Eb', '', 0.91),
    seg('c29', 59.47, 61.60, 'Ab', 'Ab', '', 0.94),
    seg('c30', 61.60, 63.72, 'Fm', 'F', 'm', 0.90),
    seg('c31', 63.72, 65.84, 'Db', 'Db', '', 0.93),
    seg('c32', 65.84, 67.97, 'Eb', 'Eb', '', 0.92),
    // Pre-Chorus 2
    seg('c33', 67.97, 70.09, 'Fm', 'F', 'm', 0.94),
    seg('c34', 70.09, 72.21, 'Eb', 'Eb', '', 0.91),
    seg('c35', 72.21, 74.34, 'Db', 'Db', '', 0.95),
    seg('c36', 74.34, 76.46, 'Eb', 'Eb', '', 0.93),
    // Chorus 2
    seg('c37', 76.46, 78.58, 'Ab', 'Ab', '', 0.97),
    seg('c38', 78.58, 80.71, 'Eb', 'Eb', '', 0.94),
    seg('c39', 80.71, 82.83, 'Fm', 'F', 'm', 0.92),
    seg('c40', 82.83, 84.96, 'Db', 'Db', '', 0.96),
    seg('c41', 84.96, 87.08, 'Ab', 'Ab', '', 0.95),
    seg('c42', 87.08, 89.20, 'Eb', 'Eb', '', 0.93),
    seg('c43', 89.20, 91.33, 'Fm', 'F', 'm', 0.91),
    seg('c44', 91.33, 93.45, 'Db', 'Db', '', 0.94),
    // Bridge
    seg('c45', 93.45, 97.70, 'Bbm', 'Bb', 'm', 0.90),
    seg('c46', 97.70, 101.95, 'Eb', 'Eb', '', 0.92),
    seg('c47', 101.95, 106.20, 'Ab', 'Ab', '', 0.94),
    seg('c48', 106.20, 108.32, 'Fm', 'F', 'm', 0.91),
    seg('c49', 108.32, 110.45, 'Db', 'Db', '', 0.95),
    seg('c50', 110.45, 112.57, 'Eb', 'Eb', '', 0.93),
    // Final Chorus
    seg('c51', 112.57, 114.70, 'Ab', 'Ab', '', 0.97),
    seg('c52', 114.70, 116.82, 'Eb', 'Eb', '', 0.94),
    seg('c53', 116.82, 118.94, 'Fm', 'F', 'm', 0.92),
    seg('c54', 118.94, 121.07, 'Db', 'Db', '', 0.95),
    seg('c55', 121.07, 123.19, 'Ab', 'Ab', '', 0.96),
    seg('c56', 123.19, 125.31, 'Eb', 'Eb', '', 0.93),
    seg('c57', 125.31, 127.44, 'Fm', 'F', 'm', 0.91),
    seg('c58', 127.44, 130.00, 'Ab', 'Ab', '', 0.94),
  ],
};

export const DEMO_VIDEOS = [
  { id: 'dQw4w9WgXcQ', label: 'Never Gonna Give You Up' },
  { id: 'fJ9rUzIMcZQ', label: 'Bohemian Rhapsody' },
  { id: 'hTWKbfoikeg', label: 'Smells Like Teen Spirit' },
];
