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

export type DetectionEngine = 'studio_master' | 'hybrid' | 'btc' | 'gemini';

export interface GroundingInfo {
  verified: boolean;
  source?: string;
  song?: string;
  artist?: string;
  soundingKey?: string;
  capo?: number;
  verifiedChords?: string[];
  capoShift?: number;
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
  grounding?: GroundingInfo;
}

export type AppView = 'input' | 'loading' | 'workspace';

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}
