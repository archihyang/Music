"""
Basic Pitch transcription service
"""

import tempfile
import os
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import numpy as np

import librosa
from basic_pitch.inference import predict, Model
from basic_pitch import ICASSP_2022_MODEL_PATH
import pretty_midi

from core.config import settings

class BasicPitchService:
    def __init__(self):
        self.model_path = ICASSP_2022_MODEL_PATH
        self.sample_rate = settings.SAMPLE_RATE
        self._model_cache = None
    
    def _get_model(self) -> Model:
        """Get or load the Basic Pitch model with caching"""
        if self._model_cache is None:
            from basic_pitch.inference import Model
            self._model_cache = Model(self.model_path)
        return self._model_cache
    
    async def transcribe_audio(
        self,
        audio_path: str,
        onset_threshold: Optional[float] = None,
        frame_threshold: Optional[float] = None,
        minimum_note_length: Optional[float] = None,
        minimum_frequency: Optional[float] = None,
        maximum_frequency: Optional[float] = None,
        multiple_pitch_bends: Optional[bool] = None,
        melodia_trick: Optional[bool] = None,
        midi_tempo: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to MIDI using Basic Pitch
        
        Args:
            audio_path: Path to audio file
            onset_threshold: Threshold for note onset detection (0-1)
            frame_threshold: Threshold for note frame detection (0-1)
            minimum_note_length: Minimum note duration in ms
            minimum_frequency: Minimum frequency to consider (Hz)
            maximum_frequency: Maximum frequency to consider (Hz)
            multiple_pitch_bends: Whether to detect multiple pitch bends
            melodia_trick: Whether to use melodia post-processing
            midi_tempo: MIDI tempo in BPM
            
        Returns:
            Dictionary containing transcription results
        """
        
        # Use default settings if not provided
        onset_threshold = onset_threshold or settings.ONSET_THRESHOLD
        frame_threshold = frame_threshold or settings.FRAME_THRESHOLD
        minimum_note_length = minimum_note_length or settings.MINIMUM_NOTE_LENGTH
        minimum_frequency = minimum_frequency or settings.MINIMUM_FREQUENCY
        maximum_frequency = maximum_frequency or settings.MAXIMUM_FREQUENCY
        multiple_pitch_bends = multiple_pitch_bends if multiple_pitch_bends is not None else settings.MULTIPLE_PITCH_BENDS
        melodia_trick = melodia_trick if melodia_trick is not None else settings.MELODIA_TRICK
        midi_tempo = midi_tempo or settings.MIDI_TEMPO
        
        try:
            # Load and validate audio
            audio_duration = self._get_audio_duration(audio_path)
            if audio_duration > settings.MAX_AUDIO_LENGTH:
                raise ValueError(f"Audio too long: {audio_duration}s (max: {settings.MAX_AUDIO_LENGTH}s)")
            
            # Run Basic Pitch prediction
            model_output, midi_data, note_events = predict(
                audio_path=audio_path,
                model_or_model_path=self.model_path,
                onset_threshold=onset_threshold,
                frame_threshold=frame_threshold,
                minimum_note_length=minimum_note_length,
                minimum_frequency=minimum_frequency,
                maximum_frequency=maximum_frequency,
                multiple_pitch_bends=multiple_pitch_bends,
                melodia_trick=melodia_trick,
                midi_tempo=midi_tempo
            )
            
            # Process results
            result = {
                "success": True,
                "audio_duration": audio_duration,
                "midi_tempo": midi_tempo,
                "statistics": {
                    "total_notes": len(note_events) if note_events else 0,
                    "duration_seconds": audio_duration,
                    "tempo": midi_tempo
                }
            }
            
            # Convert MIDI data to bytes
            if midi_data:
                with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp_file:
                    midi_data.write(tmp_file.name)
                    tmp_file.seek(0)
                    with open(tmp_file.name, 'rb') as f:
                        result["midi_data"] = f.read()
                    os.unlink(tmp_file.name)
                
                # Extract additional MIDI info
                result["midi_info"] = self._analyze_midi(midi_data)
            
            # Process note events
            if note_events:
                result["note_events"] = [
                    {
                        "start_time": float(note[0]),
                        "end_time": float(note[1]),
                        "pitch": int(note[2]),
                        "velocity": int(note[3]) if len(note) > 3 else 100,
                        "confidence": float(note[4]) if len(note) > 4 else 1.0,
                        "pitch_name": self._midi_note_to_name(int(note[2]))
                    }
                    for note in note_events
                ]
            
            # Add confidence score
            if model_output:
                result["confidence_score"] = self._calculate_confidence(model_output)
            
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "audio_duration": 0,
                "statistics": {}
            }
    
    def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds"""
        y, sr = librosa.load(audio_path, sr=None, duration=10)  # Load first 10 seconds to check
        full_duration = librosa.get_duration(filename=audio_path)
        return full_duration
    
    def _analyze_midi(self, midi_data: pretty_midi.PrettyMIDI) -> Dict[str, Any]:
        """Analyze MIDI data for additional information"""
        try:
            # Get key signature
            key_signature = None
            if midi_data.key_signature_changes:
                key_signature = midi_data.key_signature_changes[0].key_name()
            
            # Get time signature
            time_signature = None
            if midi_data.time_signature_changes:
                ts = midi_data.time_signature_changes[0]
                time_signature = f"{ts.numerator}/{ts.denominator}"
            
            # Get tempo
            tempo = midi_data.estimate_tempo()
            
            # Get instrument info
            instruments = []
            for instrument in midi_data.instruments:
                instruments.append({
                    "program": instrument.program,
                    "name": pretty_midi.program_to_instrument_name(instrument.program),
                    "is_drum": instrument.is_drum,
                    "note_count": len(instrument.notes)
                })
            
            return {
                "key_signature": key_signature,
                "time_signature": time_signature,
                "estimated_tempo": tempo,
                "instruments": instruments,
                "total_time": midi_data.get_end_time()
            }
        except Exception:
            return {}
    
    def _midi_note_to_name(self, note_number: int) -> str:
        """Convert MIDI note number to note name"""
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        octave = (note_number // 12) - 1
        note = note_names[note_number % 12]
        return f"{note}{octave}"
    
    def _calculate_confidence(self, model_output: Dict) -> float:
        """Calculate overall confidence score from model output"""
        try:
            if "note" in model_output:
                note_probs = model_output["note"]
                # Calculate mean of maximum probabilities across time
                if isinstance(note_probs, np.ndarray):
                    max_probs = np.max(note_probs, axis=1)
                    return float(np.mean(max_probs))
            return 0.5  # Default confidence
        except Exception:
            return 0.5
    
    async def process_youtube_url(self, youtube_url: str) -> Tuple[str, Dict[str, Any]]:
        """
        Download and transcribe audio from YouTube URL
        
        Returns:
            Tuple of (audio_path, transcription_result)
        """
        from services.youtube_service import YouTubeService
        
        yt_service = YouTubeService()
        audio_path = await yt_service.download_audio(youtube_url)
        
        if audio_path:
            result = await self.transcribe_audio(audio_path)
            return audio_path, result
        else:
            raise ValueError("Failed to download audio from YouTube")