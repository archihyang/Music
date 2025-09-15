"""
Music transcription service using Basic Pitch and other models
"""
import json
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import numpy as np
import pretty_midi
from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH
import music21
from loguru import logger

from config import settings
from services.audio_processor import AudioProcessor


class TranscriptionService:
    """
    Service for transcribing audio to MIDI/musical notation
    """
    
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.model_path = ICASSP_2022_MODEL_PATH
        self.confidence_threshold = settings.confidence_threshold
        self.hop_length = settings.hop_length
        
    async def initialize(self):
        """
        Initialize the transcription models
        """
        try:
            # Pre-load the model for faster inference
            logger.info("Loading Basic Pitch model...")
            # Model is loaded on first prediction, so we do a dummy prediction
            dummy_audio = np.zeros(22050)  # 1 second of silence
            _ = predict(dummy_audio, 22050, onset_threshold=0.5, frame_threshold=0.5)
            logger.info("Basic Pitch model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to initialize transcription models: {e}")
            raise
    
    def transcribe_audio(
        self,
        audio_path: Path,
        onset_threshold: float = 0.5,
        frame_threshold: float = 0.3,
        minimum_note_length: float = 0.058,
        minimum_frequency: float = 32.7,  # C1
        maximum_frequency: float = 2093.0,  # C7
        multiple_pitch_bends: bool = False,
        melodia_trick: bool = True
    ) -> Dict[str, Any]:
        """
        Transcribe audio to MIDI using Basic Pitch
        
        Args:
            audio_path: Path to audio file
            onset_threshold: Onset detection threshold
            frame_threshold: Frame activation threshold
            minimum_note_length: Minimum note length in seconds
            minimum_frequency: Minimum frequency to detect (Hz)
            maximum_frequency: Maximum frequency to detect (Hz)
            multiple_pitch_bends: Allow multiple simultaneous pitch bends
            melodia_trick: Use melodia post-processing
            
        Returns:
            Dictionary containing transcription results
        """
        try:
            # Load audio
            audio, sr = self.audio_processor.load_audio(audio_path)
            
            logger.info(f"Transcribing audio: {audio_path.name}")
            
            # Run Basic Pitch inference
            model_output, midi_data, note_events = predict(
                audio,
                sr,
                onset_threshold=onset_threshold,
                frame_threshold=frame_threshold,
                minimum_note_length=minimum_note_length,
                minimum_frequency=minimum_frequency,
                maximum_frequency=maximum_frequency,
                multiple_pitch_bends=multiple_pitch_bends,
                melodia_trick=melodia_trick,
                model_or_model_path=self.model_path
            )
            
            # Process results
            result = {
                'midi_data': midi_data,
                'note_events': note_events,
                'onset_times': model_output['onset'].tolist() if 'onset' in model_output else [],
                'pitch_contour': model_output['contour'].tolist() if 'contour' in model_output else [],
                'notes': self._extract_notes_from_midi(midi_data),
                'tempo': self._estimate_tempo(note_events),
                'key': self._estimate_key(midi_data),
                'time_signature': self._estimate_time_signature(note_events)
            }
            
            logger.info(f"Transcription complete. Found {len(result['notes'])} notes")
            
            return result
            
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            raise
    
    def _extract_notes_from_midi(self, midi_data: pretty_midi.PrettyMIDI) -> List[Dict[str, Any]]:
        """
        Extract note information from MIDI data
        
        Args:
            midi_data: PrettyMIDI object
            
        Returns:
            List of note dictionaries
        """
        notes = []
        
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                notes.append({
                    'pitch': note.pitch,
                    'start_time': note.start,
                    'end_time': note.end,
                    'duration': note.end - note.start,
                    'velocity': note.velocity,
                    'note_name': pretty_midi.note_number_to_name(note.pitch),
                    'instrument': instrument.name
                })
        
        # Sort by start time
        notes.sort(key=lambda x: x['start_time'])
        
        return notes
    
    def _estimate_tempo(self, note_events: List) -> float:
        """
        Estimate tempo from note events
        
        Args:
            note_events: List of note events
            
        Returns:
            Estimated tempo in BPM
        """
        if len(note_events) < 2:
            return 120.0  # Default tempo
        
        # Calculate inter-onset intervals
        onset_times = sorted([n[0] for n in note_events])
        intervals = np.diff(onset_times)
        
        if len(intervals) == 0:
            return 120.0
        
        # Find the most common interval (likely the beat)
        hist, bins = np.histogram(intervals, bins=50)
        beat_interval = bins[np.argmax(hist)]
        
        # Convert to BPM
        if beat_interval > 0:
            tempo = 60.0 / beat_interval
            # Clamp to reasonable range
            tempo = max(40, min(240, tempo))
            return tempo
        
        return 120.0
    
    def _estimate_key(self, midi_data: pretty_midi.PrettyMIDI) -> str:
        """
        Estimate musical key from MIDI data
        
        Args:
            midi_data: PrettyMIDI object
            
        Returns:
            Estimated key signature
        """
        try:
            # Convert MIDI to music21 stream
            score = music21.stream.Score()
            
            for instrument in midi_data.instruments:
                part = music21.stream.Part()
                
                for note in instrument.notes:
                    n = music21.note.Note(
                        pitch=note.pitch,
                        quarterLength=(note.end - note.start) * 2,  # Approximate conversion
                        offset=note.start * 2
                    )
                    part.append(n)
                
                score.append(part)
            
            # Analyze key
            key = score.analyze('key')
            return str(key)
            
        except Exception as e:
            logger.warning(f"Could not estimate key: {e}")
            return "C major"  # Default
    
    def _estimate_time_signature(self, note_events: List) -> str:
        """
        Estimate time signature from note events
        
        Args:
            note_events: List of note events
            
        Returns:
            Estimated time signature
        """
        # Simple heuristic based on note groupings
        # This is a placeholder - real implementation would be more sophisticated
        return "4/4"  # Default to common time
    
    def midi_to_tab(
        self,
        midi_data: pretty_midi.PrettyMIDI,
        tuning: List[int] = None,
        capo: int = 0
    ) -> Dict[str, Any]:
        """
        Convert MIDI data to guitar tablature
        
        Args:
            midi_data: PrettyMIDI object
            tuning: Guitar tuning as MIDI note numbers (default: standard tuning)
            capo: Capo position
            
        Returns:
            Guitar tablature data
        """
        if tuning is None:
            # Standard guitar tuning (E-A-D-G-B-E)
            tuning = [40, 45, 50, 55, 59, 64]  # MIDI note numbers
        
        # Adjust for capo
        tuning = [t + capo for t in tuning]
        
        tab_data = {
            'tuning': tuning,
            'capo': capo,
            'measures': [],
            'strings': [[] for _ in range(6)]
        }
        
        # Extract notes
        notes = []
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                notes.append({
                    'pitch': note.pitch,
                    'start': note.start,
                    'duration': note.end - note.start
                })
        
        # Sort by start time
        notes.sort(key=lambda x: x['start'])
        
        # Convert to tab
        for note in notes:
            fret_positions = self._find_fret_positions(note['pitch'], tuning)
            
            if fret_positions:
                # Choose the best position (closest to previous position or lowest fret)
                best_position = min(fret_positions, key=lambda x: x[1])
                string, fret = best_position
                
                tab_data['strings'][string].append({
                    'fret': fret,
                    'time': note['start'],
                    'duration': note['duration']
                })
        
        return tab_data
    
    def _find_fret_positions(
        self,
        pitch: int,
        tuning: List[int],
        max_fret: int = 24
    ) -> List[Tuple[int, int]]:
        """
        Find possible fret positions for a given pitch
        
        Args:
            pitch: MIDI note number
            tuning: Guitar tuning
            max_fret: Maximum fret number
            
        Returns:
            List of (string, fret) tuples
        """
        positions = []
        
        for string_num, open_string in enumerate(tuning):
            fret = pitch - open_string
            if 0 <= fret <= max_fret:
                positions.append((string_num, fret))
        
        return positions
    
    def generate_music_xml(
        self,
        midi_data: pretty_midi.PrettyMIDI,
        title: str = "Transcription",
        composer: str = "AI Transcribed"
    ) -> str:
        """
        Generate MusicXML from MIDI data
        
        Args:
            midi_data: PrettyMIDI object
            title: Score title
            composer: Composer name
            
        Returns:
            MusicXML string
        """
        try:
            # Create music21 score
            score = music21.stream.Score()
            score.metadata = music21.metadata.Metadata()
            score.metadata.title = title
            score.metadata.composer = composer
            
            # Convert MIDI to music21
            for instrument in midi_data.instruments:
                part = music21.stream.Part()
                part.partName = instrument.name or "Guitar"
                
                for note in instrument.notes:
                    n = music21.note.Note(
                        pitch=note.pitch,
                        quarterLength=(note.end - note.start) * 2,
                        offset=note.start * 2
                    )
                    n.volume.velocity = note.velocity
                    part.append(n)
                
                score.append(part)
            
            # Export to MusicXML
            from io import StringIO
            output = StringIO()
            score.write('musicxml', fp=output)
            musicxml_string = output.getvalue()
            
            return musicxml_string
            
        except Exception as e:
            logger.error(f"Error generating MusicXML: {e}")
            raise
    
    def save_transcription(
        self,
        transcription_result: Dict[str, Any],
        output_dir: Path,
        base_name: str,
        save_midi: bool = True,
        save_musicxml: bool = True,
        save_tab: bool = True
    ) -> Dict[str, Path]:
        """
        Save transcription results to files
        
        Args:
            transcription_result: Transcription results
            output_dir: Output directory
            base_name: Base filename
            save_midi: Save MIDI file
            save_musicxml: Save MusicXML file
            save_tab: Save tablature JSON
            
        Returns:
            Dictionary of output file paths
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_files = {}
        
        # Save MIDI
        if save_midi and 'midi_data' in transcription_result:
            midi_path = output_dir / f"{base_name}.mid"
            transcription_result['midi_data'].write(str(midi_path))
            output_files['midi'] = midi_path
            logger.info(f"Saved MIDI: {midi_path}")
        
        # Save MusicXML
        if save_musicxml and 'midi_data' in transcription_result:
            musicxml = self.generate_music_xml(
                transcription_result['midi_data'],
                title=base_name
            )
            musicxml_path = output_dir / f"{base_name}.musicxml"
            musicxml_path.write_text(musicxml, encoding='utf-8')
            output_files['musicxml'] = musicxml_path
            logger.info(f"Saved MusicXML: {musicxml_path}")
        
        # Save tablature
        if save_tab and 'midi_data' in transcription_result:
            tab_data = self.midi_to_tab(transcription_result['midi_data'])
            tab_path = output_dir / f"{base_name}_tab.json"
            tab_path.write_text(json.dumps(tab_data, indent=2))
            output_files['tab'] = tab_path
            logger.info(f"Saved tablature: {tab_path}")
        
        # Save metadata
        metadata = {
            'tempo': transcription_result.get('tempo'),
            'key': transcription_result.get('key'),
            'time_signature': transcription_result.get('time_signature'),
            'num_notes': len(transcription_result.get('notes', [])),
            'duration': max([n['end_time'] for n in transcription_result.get('notes', [{'end_time': 0}])])
        }
        metadata_path = output_dir / f"{base_name}_metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2))
        output_files['metadata'] = metadata_path
        
        return output_files