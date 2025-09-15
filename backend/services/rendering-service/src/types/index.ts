export interface RenderOptions {
  format: 'svg' | 'png' | 'pdf';
  width: number;
  height: number;
  clef: 'treble' | 'bass' | 'alto';
  keySignature: string;
  timeSignature: string;
  showTabs: boolean;
  title?: string;
  composer?: string;
}

export interface ConversionOptions {
  format: 'notation' | 'tab' | 'both';
  outputFormat: 'svg' | 'png' | 'pdf';
  instrument: 'guitar' | 'piano' | 'bass';
  tuning?: 'standard' | 'drop-d' | 'open-g';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AnalysisOptions {
  analyzeChords: boolean;
  analyzeScale: boolean;
  analyzeRhythm: boolean;
  analyzeDifficulty: boolean;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    fileSize?: number;
    format?: string;
  };
}

export interface MusicTheoryAnalysis {
  key: string;
  scale: string[];
  chords: Array<{
    measure: number;
    beat: number;
    chord: string;
    quality: string;
  }>;
  tempo: number;
  timeSignature: string;
  difficulty: {
    overall: string;
    technical: string;
    rhythmic: string;
    harmonic: string;
  };
}

export interface ExerciseRecommendation {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  instructions: string[];
  focusArea: string;
  midiData?: string;
}

export interface StyleAnalysis {
  genre: string;
  era: string;
  characteristics: string[];
  similarArtists: string[];
  recommendedSongs: Array<{
    title: string;
    artist: string;
    similarity: number;
    reason: string;
  }>;
}

export interface FingeringPattern {
  measure: number;
  beat: number;
  frets: number[];
  fingers: number[];
  difficulty: number;
  alternatives?: Array<{
    frets: number[];
    fingers: number[];
    difficulty: number;
  }>;
}