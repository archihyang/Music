// app.d.ts - 전역 타입 정의
/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    
    interface Locals {
      user?: {
        id: string;
        email: string;
      };
    }
    
    interface PageData {
      user?: {
        id: string;
        email: string;
      };
    }
    
    interface Platform {}
  }

  // Web Audio API 확장
  interface Window {
    webkitAudioContext: typeof AudioContext;
    fs?: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<ArrayBuffer | string>;
    };
  }
}

// 커스텀 타입 정의
export interface Transcription {
  id: string;
  sourceUrl?: string;
  audioFile?: string;
  midiData: MidiData;
  tabData: TabData;
  theoryAnalysis?: TheoryAnalysis;
  createdAt: Date;
}

export interface MidiData {
  notes: Note[];
  tempo: number;
  timeSignature: [number, number];
  key: string;
}

export interface Note {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export interface TabData {
  measures: TabMeasure[];
  tuning: string[];
}

export interface TabMeasure {
  notes: TabNote[];
  chordSymbol?: string;
}

export interface TabNote {
  string: number;
  fret: number;
  duration: string;
  techniques?: string[];
}

export interface TheoryAnalysis {
  key: string;
  mode: string;
  chordProgression: ChordSymbol[];
  romanNumerals: string[];
  modalInterchanges?: ModalInterchange[];
  secondaryDominants?: SecondaryDominant[];
}

export interface ChordSymbol {
  root: string;
  quality: string;
  extensions?: string[];
  beat: number;
}

export interface ModalInterchange {
  chord: string;
  borrowedFrom: string;
  measure: number;
}

export interface SecondaryDominant {
  chord: string;
  targetChord: string;
  measure: number;
}

export {};
