"""
Test suite for AI Service components
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, MagicMock
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from services.basic_pitch_service import BasicPitchService
from services.transcription import TranscriptionService
from services.youtube_processor import YouTubeProcessor


class TestBasicPitchService:
    """Test Basic Pitch service"""
    
    def test_initialization(self):
        """Test service initialization"""
        service = BasicPitchService()
        assert service is not None
    
    @patch('services.basic_pitch_service.basic_pitch')
    def test_process_audio_mock(self, mock_basic_pitch):
        """Test audio processing with mocked basic_pitch"""
        # Mock the basic_pitch.predict function
        mock_model_output = MagicMock()
        mock_model_output.note_events = []
        mock_model_output.predicted_onsets = np.zeros((100, 88))
        mock_basic_pitch.predict.return_value = mock_model_output
        
        service = BasicPitchService()
        # Create a dummy audio array
        audio = np.zeros(44100)  # 1 second of silence
        sample_rate = 44100
        
        result = service.process_audio(audio, sample_rate)
        assert result is not None


class TestTranscriptionService:
    """Test Transcription service"""
    
    def test_initialization(self):
        """Test service initialization"""
        service = TranscriptionService()
        assert service is not None
        assert service.job_id is None
    
    def test_set_job_id(self):
        """Test setting job ID"""
        service = TranscriptionService()
        service.set_job_id("test-job-123")
        assert service.job_id == "test-job-123"


class TestYouTubeProcessor:
    """Test YouTube processor"""
    
    def test_initialization(self):
        """Test processor initialization"""
        processor = YouTubeProcessor()
        assert processor is not None
    
    def test_validate_url(self):
        """Test URL validation"""
        processor = YouTubeProcessor()
        
        # Valid YouTube URLs
        valid_urls = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ"
        ]
        
        for url in valid_urls:
            assert processor.validate_url(url) == True
        
        # Invalid URLs
        invalid_urls = [
            "https://www.google.com",
            "not-a-url",
            "https://vimeo.com/123456"
        ]
        
        for url in invalid_urls:
            assert processor.validate_url(url) == False