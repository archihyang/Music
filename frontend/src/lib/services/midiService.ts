/**
 * MIDI Service
 * Comprehensive MIDI processing and integration
 */

import { Midi } from '@tonejs/midi';
import * as Tone from 'tone';
import { writable, derived } from 'svelte/store';
import { errorHandler } from '$lib/utils/errorHandler';

// MIDI Data Types
export interface MidiNote {
  pitch: number;
  velocity: number;
  time: number;
  duration: number;
  name?: string;
}

export interface MidiTrack {
  name: string;
  instrument: string;
  channel: number;
  notes: MidiNote[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

export interface MidiData {
  name: string;
  duration: number;
  tracks: MidiTrack[];
  tempos: Array<{ time: number; bpm: number }>;
  timeSignatures: Array<{ time: number; numerator: number; denominator: number }>;
  keySignatures: Array<{ time: number; key: string; scale: string }>;
}

export interface MidiPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentMeasure: number;
  currentBeat: number;
  tempo: number;
  loop: { enabled: boolean; start: number; end: number };
  playbackRate: number;
}

// MIDI Store
function createMidiStore() {
  const { subscribe, set, update } = writable<MidiData | null>(null);
  
  return {
    subscribe,
    set,
    update,
    clear: () => set(null)
  };
}

export const midiStore = createMidiStore();

// Playback State Store
function createPlaybackStore() {
  const { subscribe, set, update } = writable<MidiPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentMeasure: 1,
    currentBeat: 1,
    tempo: 120,
    loop: { enabled: false, start: 0, end: 0 },
    playbackRate: 1.0
  });
  
  return {
    subscribe,
    set,
    update,
    reset: () => set({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      currentMeasure: 1,
      currentBeat: 1,
      tempo: 120,
      loop: { enabled: false, start: 0, end: 0 },
      playbackRate: 1.0
    })
  };
}

export const playbackState = createPlaybackStore();

// MIDI Service Class
class MidiService {
  private static instance: MidiService;
  private synths: Map<number, Tone.PolySynth> = new Map();
  private parts: Map<number, Tone.Part> = new Map();
  private currentMidi: Midi | null = null;
  private metronome: Tone.Synth | null = null;
  private clickPart: Tone.Part | null = null;
  
  private constructor() {
    this.initializeSynths();
  }
  
  static getInstance(): MidiService {
    if (!MidiService.instance) {
      MidiService.instance = new MidiService();
    }
    return MidiService.instance;
  }
  
  /**
   * Initialize synthesizers for each MIDI channel
   */
  private initializeSynths() {
    // Create 16 synths for 16 MIDI channels
    for (let i = 0; i < 16; i++) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 32,
        voice: Tone.Synth,
        options: {
          oscillator: { type: this.getOscillatorType(i) },
          envelope: this.getEnvelope(i)
        }
      }).toDestination();
      
      this.synths.set(i, synth);
    }
    
    // Initialize metronome
    this.metronome = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination();
  }
  
  /**
   * Get oscillator type based on MIDI channel/instrument
   */
  private getOscillatorType(channel: number): OscillatorType {
    // Channel 9 (index 8) is typically drums
    if (channel === 9) return 'sine';
    
    // Different oscillator types for different instruments
    const types: OscillatorType[] = ['triangle', 'sawtooth', 'square', 'sine'];
    return types[channel % 4];
  }
  
  /**
   * Get envelope settings based on channel
   */
  private getEnvelope(channel: number) {
    // Different envelope settings for different instruments
    if (channel === 9) {
      // Drums - quick attack and release
      return { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 };
    } else if (channel < 4) {
      // Piano/Keys - medium attack
      return { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.8 };
    } else if (channel < 8) {
      // Strings - slow attack
      return { attack: 0.4, decay: 0.2, sustain: 0.7, release: 1.2 };
    } else {
      // Other - balanced
      return { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 };
    }
  }
  
  /**
   * Load MIDI file from URL
   */
  async loadMidiFromUrl(url: string): Promise<MidiData> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return this.loadMidiFromBuffer(arrayBuffer);
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Loading MIDI from URL', url });
      throw error;
    }
  }
  
  /**
   * Load MIDI file from ArrayBuffer
   */
  async loadMidiFromBuffer(buffer: ArrayBuffer): Promise<MidiData> {
    try {
      const midi = new Midi(buffer);
      this.currentMidi = midi;
      
      // Convert to our MidiData format
      const midiData: MidiData = {
        name: midi.name || 'Untitled',
        duration: midi.duration,
        tracks: midi.tracks.map((track, index) => ({
          name: track.name || `Track ${index + 1}`,
          instrument: track.instrument?.name || 'Unknown',
          channel: track.channel || 0,
          notes: track.notes.map(note => ({
            pitch: note.midi,
            velocity: note.velocity * 127,
            time: note.time,
            duration: note.duration,
            name: note.name
          })),
          volume: 0.7,
          pan: 0,
          muted: false,
          solo: false
        })),
        tempos: midi.header.tempos.map(tempo => ({
          time: tempo.time || 0,
          bpm: tempo.bpm
        })),
        timeSignatures: midi.header.timeSignatures.map(ts => ({
          time: ts.time || 0,
          numerator: ts.numerator,
          denominator: ts.denominator
        })),
        keySignatures: midi.header.keySignatures.map(ks => ({
          time: ks.time || 0,
          key: ks.key,
          scale: ks.scale
        }))
      };
      
      // Update store
      midiStore.set(midiData);
      
      // Setup playback
      this.setupPlayback(midiData);
      
      return midiData;
    } catch (error) {
      errorHandler.logError(error as Error, 'high', { context: 'Parsing MIDI data' });
      throw error;
    }
  }
  
  /**
   * Setup MIDI playback with Tone.js
   */
  private setupPlayback(midiData: MidiData) {
    // Clear existing parts
    this.clearPlayback();
    
    // Create parts for each track
    midiData.tracks.forEach((track, trackIndex) => {
      if (track.notes.length === 0) return;
      
      const synth = this.synths.get(track.channel);
      if (!synth) return;
      
      // Create Tone.Part for this track
      const part = new Tone.Part((time, note) => {
        if (!track.muted && (!this.hasSoloTrack(midiData) || track.solo)) {
          synth.triggerAttackRelease(
            this.midiToFrequency(note.pitch),
            note.duration,
            time,
            note.velocity / 127
          );
        }
      }, track.notes.map(note => [note.time, note]));
      
      part.loop = false;
      part.start(0);
      
      this.parts.set(trackIndex, part);
    });
    
    // Set tempo
    if (midiData.tempos.length > 0) {
      Tone.Transport.bpm.value = midiData.tempos[0].bpm;
      playbackState.update(state => ({ ...state, tempo: midiData.tempos[0].bpm }));
    }
    
    // Update duration
    playbackState.update(state => ({ ...state, duration: midiData.duration }));
  }
  
  /**
   * Check if any track has solo enabled
   */
  private hasSoloTrack(midiData: MidiData): boolean {
    return midiData.tracks.some(track => track.solo);
  }
  
  /**
   * Convert MIDI note number to frequency
   */
  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  
  /**
   * Export MidiData to MIDI file
   */
  async exportToMidi(midiData: MidiData): Promise<Blob> {
    try {
      const midi = new Midi();
      midi.name = midiData.name;
      
      // Set tempo
      if (midiData.tempos.length > 0) {
        midi.header.tempos.push({
          ticks: 0,
          bpm: midiData.tempos[0].bpm
        });
      }
      
      // Add tracks
      midiData.tracks.forEach(track => {
        const midiTrack = midi.addTrack();
        midiTrack.name = track.name;
        midiTrack.channel = track.channel;
        
        // Add notes
        track.notes.forEach(note => {
          midiTrack.addNote({
            midi: note.pitch,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity / 127
          });
        });
      });
      
      // Convert to blob
      const arrayBuffer = midi.toArray();
      return new Blob([arrayBuffer], { type: 'audio/midi' });
    } catch (error) {
      errorHandler.logError(error as Error, 'medium', { context: 'Exporting MIDI' });
      throw error;
    }
  }
  
  /**
   * Play MIDI
   */
  async play() {
    await Tone.start();
    Tone.Transport.start();
    playbackState.update(state => ({ ...state, isPlaying: true }));
    
    // Update time regularly
    const updateInterval = setInterval(() => {
      if (Tone.Transport.state === 'started') {
        const currentTime = Tone.Transport.seconds;
        const currentBar = Tone.Transport.position.split(':')[0];
        const currentBeat = Tone.Transport.position.split(':')[1];
        
        playbackState.update(state => ({
          ...state,
          currentTime,
          currentMeasure: parseInt(currentBar) + 1,
          currentBeat: parseInt(currentBeat) + 1
        }));
        
        // Handle loop
        const state = playbackState;
        let loopState;
        state.subscribe(s => loopState = s)();
        
        if (loopState?.loop.enabled && currentTime >= loopState.loop.end) {
          Tone.Transport.seconds = loopState.loop.start;
        }
      } else {
        clearInterval(updateInterval);
      }
    }, 50);
  }
  
  /**
   * Pause MIDI playback
   */
  pause() {
    Tone.Transport.pause();
    playbackState.update(state => ({ ...state, isPlaying: false }));
  }
  
  /**
   * Stop MIDI playback
   */
  stop() {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;
    playbackState.update(state => ({
      ...state,
      isPlaying: false,
      currentTime: 0,
      currentMeasure: 1,
      currentBeat: 1
    }));
  }
  
  /**
   * Seek to specific time
   */
  seek(time: number) {
    Tone.Transport.seconds = time;
    playbackState.update(state => ({ ...state, currentTime: time }));
  }
  
  /**
   * Set playback speed
   */
  setPlaybackRate(rate: number) {
    Tone.Transport.bpm.value = 120 * rate; // Adjust based on original tempo
    playbackState.update(state => ({ ...state, playbackRate: rate }));
  }
  
  /**
   * Set loop
   */
  setLoop(enabled: boolean, start?: number, end?: number) {
    playbackState.update(state => ({
      ...state,
      loop: {
        enabled,
        start: start ?? state.loop.start,
        end: end ?? state.loop.end
      }
    }));
  }
  
  /**
   * Toggle track mute
   */
  toggleTrackMute(trackIndex: number) {
    midiStore.update(data => {
      if (!data) return data;
      
      const tracks = [...data.tracks];
      tracks[trackIndex] = {
        ...tracks[trackIndex],
        muted: !tracks[trackIndex].muted
      };
      
      return { ...data, tracks };
    });
  }
  
  /**
   * Toggle track solo
   */
  toggleTrackSolo(trackIndex: number) {
    midiStore.update(data => {
      if (!data) return data;
      
      const tracks = [...data.tracks];
      tracks[trackIndex] = {
        ...tracks[trackIndex],
        solo: !tracks[trackIndex].solo
      };
      
      return { ...data, tracks };
    });
  }
  
  /**
   * Set track volume
   */
  setTrackVolume(trackIndex: number, volume: number) {
    const synth = this.synths.get(trackIndex);
    if (synth) {
      synth.volume.value = Tone.gainToDb(volume);
    }
    
    midiStore.update(data => {
      if (!data) return data;
      
      const tracks = [...data.tracks];
      tracks[trackIndex] = {
        ...tracks[trackIndex],
        volume
      };
      
      return { ...data, tracks };
    });
  }
  
  /**
   * Enable metronome
   */
  enableMetronome(enabled: boolean) {
    if (!this.metronome) return;
    
    if (enabled) {
      // Create click track based on time signature
      const clickNotes: Array<[number, string]> = [];
      const duration = 60; // 60 seconds of clicks
      const bpm = 120; // Default BPM
      const beatInterval = 60 / bpm;
      
      for (let time = 0; time < duration; time += beatInterval) {
        const beat = Math.floor(time / beatInterval) % 4;
        const note = beat === 0 ? 'C5' : 'C4'; // Accent on downbeat
        clickNotes.push([time, note]);
      }
      
      this.clickPart = new Tone.Part((time, note) => {
        this.metronome?.triggerAttackRelease(note, '16n', time);
      }, clickNotes);
      
      this.clickPart.loop = true;
      this.clickPart.loopEnd = duration;
      this.clickPart.start(0);
    } else {
      this.clickPart?.stop();
      this.clickPart?.dispose();
      this.clickPart = null;
    }
  }
  
  /**
   * Clear playback
   */
  private clearPlayback() {
    this.parts.forEach(part => {
      part.stop();
      part.dispose();
    });
    this.parts.clear();
    
    this.clickPart?.stop();
    this.clickPart?.dispose();
    this.clickPart = null;
  }
  
  /**
   * Cleanup
   */
  destroy() {
    this.clearPlayback();
    
    this.synths.forEach(synth => {
      synth.dispose();
    });
    this.synths.clear();
    
    this.metronome?.dispose();
    this.metronome = null;
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
}

// Export singleton instance
export const midiService = MidiService.getInstance();

// Utility functions
export function downloadMidi(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatMidiTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}