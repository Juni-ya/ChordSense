export interface ChordSegment {
  id: string;
  startTime: number;
  endTime: number;
  chord: string;
  root: string;
  quality: string;
  bass?: string;
  confidence: number;
}

export interface SongAnalysisResponse {
  videoId: string;
  title: string;
  artist?: string;
  bpm: number;
  key: string;
  timeSignature: string;
  suggestedCapo: number;
  chords: ChordSegment[];
  engine?: 'studio_master' | 'hybrid' | 'btc' | 'gemini';
}

export interface AnalyzeRequest {
  url: string;
  engine?: 'studio_master' | 'hybrid' | 'btc' | 'gemini';
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  artist?: string;
  duration: number;
}

/** Shape of the JSON we request from Gemini */
export interface GeminiChordResponse {
  bpm: number;
  detectedKey: string;
  timeSignature: string;
  suggestedCapo: number;
  chords: {
    startTime: number;
    endTime: number;
    chord: string;
    confidence: number;
  }[];
}
