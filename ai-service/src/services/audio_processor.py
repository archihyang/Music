"""
Audio processing service for handling various audio formats and preprocessing
"""
import io
from pathlib import Path
from typing import Optional, Tuple, Union
import numpy as np
import soundfile as sf
import librosa
from pydub import AudioSegment
from loguru import logger

from config import settings


class AudioProcessor:
    """
    Service for audio file processing and conversion
    """
    
    def __init__(self):
        self.sample_rate = settings.sample_rate
        self.supported_formats = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']
        
    def load_audio(
        self,
        file_path: Union[str, Path],
        sr: Optional[int] = None,
        mono: bool = True,
        offset: float = 0.0,
        duration: Optional[float] = None
    ) -> Tuple[np.ndarray, int]:
        """
        Load audio file and convert to numpy array
        
        Args:
            file_path: Path to audio file
            sr: Target sample rate (None to preserve original)
            mono: Convert to mono
            offset: Start reading after this time (in seconds)
            duration: Only load this much audio (in seconds)
            
        Returns:
            Tuple of (audio array, sample rate)
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        if file_path.suffix.lower() not in self.supported_formats:
            raise ValueError(f"Unsupported audio format: {file_path.suffix}")
        
        try:
            # Use librosa for loading
            audio, sample_rate = librosa.load(
                file_path,
                sr=sr or self.sample_rate,
                mono=mono,
                offset=offset,
                duration=duration
            )
            
            logger.info(f"Loaded audio: {file_path.name}, shape: {audio.shape}, sr: {sample_rate}")
            return audio, sample_rate
            
        except Exception as e:
            logger.error(f"Error loading audio file: {e}")
            raise
    
    def save_audio(
        self,
        audio: np.ndarray,
        file_path: Union[str, Path],
        sr: int = None,
        format: str = 'wav'
    ) -> Path:
        """
        Save audio array to file
        
        Args:
            audio: Audio array
            file_path: Output file path
            sr: Sample rate
            format: Output format
            
        Returns:
            Path to saved file
        """
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        sr = sr or self.sample_rate
        
        try:
            if format == 'wav':
                sf.write(file_path, audio, sr)
            else:
                # Use pydub for other formats
                audio_segment = AudioSegment(
                    audio.tobytes(),
                    frame_rate=sr,
                    sample_width=audio.dtype.itemsize,
                    channels=1 if len(audio.shape) == 1 else audio.shape[1]
                )
                audio_segment.export(file_path, format=format)
            
            logger.info(f"Saved audio to: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving audio: {e}")
            raise
    
    def convert_to_mono(self, audio: np.ndarray) -> np.ndarray:
        """
        Convert stereo audio to mono
        
        Args:
            audio: Audio array
            
        Returns:
            Mono audio array
        """
        if len(audio.shape) == 1:
            return audio
        
        if len(audio.shape) == 2:
            # Average the channels
            return np.mean(audio, axis=1)
        
        raise ValueError(f"Unexpected audio shape: {audio.shape}")
    
    def resample(
        self,
        audio: np.ndarray,
        orig_sr: int,
        target_sr: int
    ) -> np.ndarray:
        """
        Resample audio to target sample rate
        
        Args:
            audio: Audio array
            orig_sr: Original sample rate
            target_sr: Target sample rate
            
        Returns:
            Resampled audio
        """
        if orig_sr == target_sr:
            return audio
        
        return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
    
    def normalize(
        self,
        audio: np.ndarray,
        method: str = 'peak',
        target_level: float = -3.0
    ) -> np.ndarray:
        """
        Normalize audio
        
        Args:
            audio: Audio array
            method: Normalization method ('peak' or 'rms')
            target_level: Target level in dB
            
        Returns:
            Normalized audio
        """
        if method == 'peak':
            peak = np.abs(audio).max()
            if peak > 0:
                target_amplitude = 10 ** (target_level / 20)
                audio = audio * (target_amplitude / peak)
        
        elif method == 'rms':
            rms = np.sqrt(np.mean(audio ** 2))
            if rms > 0:
                target_rms = 10 ** (target_level / 20)
                audio = audio * (target_rms / rms)
        
        return audio
    
    def trim_silence(
        self,
        audio: np.ndarray,
        sr: int = None,
        top_db: int = 20
    ) -> np.ndarray:
        """
        Trim silence from beginning and end of audio
        
        Args:
            audio: Audio array
            sr: Sample rate
            top_db: Threshold in dB below reference to consider as silence
            
        Returns:
            Trimmed audio
        """
        sr = sr or self.sample_rate
        trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
        return trimmed
    
    def split_audio(
        self,
        audio: np.ndarray,
        sr: int = None,
        segment_length: float = 30.0,
        overlap: float = 5.0
    ) -> list[np.ndarray]:
        """
        Split audio into segments with optional overlap
        
        Args:
            audio: Audio array
            sr: Sample rate
            segment_length: Length of each segment in seconds
            overlap: Overlap between segments in seconds
            
        Returns:
            List of audio segments
        """
        sr = sr or self.sample_rate
        segment_samples = int(segment_length * sr)
        overlap_samples = int(overlap * sr)
        step_samples = segment_samples - overlap_samples
        
        segments = []
        for i in range(0, len(audio), step_samples):
            segment = audio[i:i + segment_samples]
            if len(segment) < segment_samples:
                # Pad the last segment if needed
                segment = np.pad(segment, (0, segment_samples - len(segment)))
            segments.append(segment)
        
        return segments
    
    def extract_features(
        self,
        audio: np.ndarray,
        sr: int = None
    ) -> dict:
        """
        Extract audio features for analysis
        
        Args:
            audio: Audio array
            sr: Sample rate
            
        Returns:
            Dictionary of audio features
        """
        sr = sr or self.sample_rate
        
        features = {}
        
        # Spectral features
        features['spectral_centroid'] = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        features['spectral_rolloff'] = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        features['spectral_bandwidth'] = librosa.feature.spectral_bandwidth(y=audio, sr=sr)[0]
        features['zero_crossing_rate'] = librosa.feature.zero_crossing_rate(audio)[0]
        
        # MFCCs
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        for i in range(13):
            features[f'mfcc_{i}'] = mfccs[i]
        
        # Rhythm features
        tempo, beats = librosa.beat.beat_track(y=audio, sr=sr)
        features['tempo'] = tempo
        features['beat_frames'] = beats
        
        # Energy
        features['rms_energy'] = librosa.feature.rms(y=audio)[0]
        
        return features
    
    def apply_effects(
        self,
        audio: np.ndarray,
        sr: int = None,
        effects: dict = None
    ) -> np.ndarray:
        """
        Apply audio effects
        
        Args:
            audio: Audio array
            sr: Sample rate
            effects: Dictionary of effects to apply
            
        Returns:
            Processed audio
        """
        sr = sr or self.sample_rate
        
        if effects is None:
            return audio
        
        # Apply pitch shift
        if 'pitch_shift' in effects:
            n_steps = effects['pitch_shift']
            audio = librosa.effects.pitch_shift(audio, sr=sr, n_steps=n_steps)
        
        # Apply time stretch
        if 'time_stretch' in effects:
            rate = effects['time_stretch']
            audio = librosa.effects.time_stretch(audio, rate=rate)
        
        # Apply harmonic-percussive separation
        if 'harmonic' in effects and effects['harmonic']:
            audio = librosa.effects.harmonic(audio)
        
        if 'percussive' in effects and effects['percussive']:
            audio = librosa.effects.percussive(audio)
        
        return audio