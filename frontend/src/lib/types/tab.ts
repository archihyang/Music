// Tab-related type definitions

export interface GuitarNote {
  pitch: number;
  start_time: number;
  end_time: number;
  string: number;
  fret: number;
  velocity: number;
  techniques: PlayingTechnique[];
  is_chord_tone?: boolean;
  chord_shape?: string;
  difficulty: number;
}

export enum PlayingTechnique {
  NORMAL = "normal",
  HAMMER_ON = "hammer_on",
  PULL_OFF = "pull_off",
  SLIDE_UP = "slide_up",
  SLIDE_DOWN = "slide_down",
  BEND = "bend",
  VIBRATO = "vibrato",
  PALM_MUTE = "palm_mute",
  HARMONIC = "harmonic",
  TAP = "tap",
  DEAD_NOTE = "dead_note"
}

export interface TabMeasure {
  number: number;
  time_signature: [number, number];
  tempo: number;
  notes: GuitarNote[];
  chords?: any[];
  lyrics?: string;
}

export interface VexFlowData {
  config: RenderConfiguration;
  staves: StaveData[];
  chord_diagrams: ChordDiagram[];
  tempo: number;
  time_signature: [number, number];
  duration?: number;
}

export interface RenderConfiguration {
  width: number;
  height: number;
  measures_per_line: number;
  tab_line_spacing: number;
  system_spacing: number;
  font_family: string;
  font_size: number;
  note_color: string;
  technique_color: string;
  chord_diagram_size: number;
  show_notation: boolean;
  show_tablature: boolean;
  show_chord_diagrams: boolean;
  show_techniques: boolean;
  show_fingering: boolean;
  show_time_signature: boolean;
  show_tempo: boolean;
}

export interface StaveData {
  x: number;
  y: number;
  width: number;
  options: {
    num_lines: number;
    spacing_between_lines_px: number;
  };
  clef?: string;
  time_signature?: string;
  tempo?: {
    duration: string;
    bpm: number;
  };
  notes: VexFlowNote[];
}

export interface VexFlowNote {
  positions: Array<{
    str: number;
    fret: number;
  }>;
  duration: string;
  modifiers?: Array<{
    type: string;
    text: string;
    position: string;
  }>;
}

export interface ChordDiagram {
  x: number;
  y: number;
  chord: string;
  positions: Array<{
    str: number;
    fret: number;
  }>;
  barres: Array<{
    from_string: number;
    to_string: number;
    fret: number;
  }>;
}