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
  videoId: 'XFkzRNyygfk',
  title: 'Creep',
  artist: 'Radiohead',
  bpm: 92,
  key: 'G Major',
  timeSignature: '4/4',
  suggestedCapo: 0,
  chords: [
    // Intro & Verse 1
    seg('c01', 0.0, 18.0, 'G', 'G', '', 0.95),
    seg('c02', 18.0, 36.0, 'B', 'B', '', 0.94),
    seg('c03', 36.0, 54.0, 'C', 'C', '', 0.96),
    seg('c04', 54.0, 72.0, 'Cm', 'C', 'm', 0.93),
    // Verse 2
    seg('c05', 72.0, 90.0, 'G', 'G', '', 0.95),
    seg('c06', 90.0, 108.0, 'B', 'B', '', 0.93),
    seg('c07', 108.0, 126.0, 'C', 'C', '', 0.96),
    seg('c08', 126.0, 144.0, 'Cm', 'C', 'm', 0.94),
    // Chorus 1
    seg('c09', 144.0, 162.0, 'G', 'G', '', 0.97),
    seg('c10', 162.0, 180.0, 'B', 'B', '', 0.94),
    seg('c11', 180.0, 198.0, 'C', 'C', '', 0.96),
    seg('c12', 198.0, 216.0, 'Cm', 'C', 'm', 0.93),
    // Outro
    seg('c13', 216.0, 234.0, 'G', 'G', '', 0.95),
    seg('c14', 234.0, 240.0, 'N.C.', 'N.C.', '', 0.90),
  ],
};

export const DEMO_VIDEOS = [
  { id: 'XFkzRNyygfk', label: 'Radiohead - Creep' },
];
