"""
오디오 전사 서비스 - 메인 오케스트레이션
Genesis Music - AI 기반 기타 학습 플랫폼

주요 기능:
- 오디오 → MIDI 전사 (Basic Pitch)
- MIDI → Tab 변환
- 음악 이론 분석 (music21)
- 실시간 진행률 추적
- YouTube 다운로드 통합
"""

import asyncio
import logging
import json
import uuid
from pathlib import Path
from typing import Dict, Optional, Any, Union, Callable
from datetime import datetime
from enum import Enum

# Service imports
from .basic_pitch_service import BasicPitchService, TranscriptionConfig, TranscriptionResult
from .midi_to_tab_converter import MidiToTabConverter, TabConfig, Tuning
from ..processors.youtube_processor import YouTubeProcessor, DownloadConfig, DownloadProgress

# Music analysis
try:
    from music21 import converter, roman, analysis, key
    HAS_MUSIC21 = True
except ImportError:
    HAS_MUSIC21 = False
    logging.warning("music21 not installed. Theory analysis will be limited.")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProcessingStage(Enum):
    """처리 단계"""
    DOWNLOADING = "downloading"
    TRANSCRIBING = "transcribing"
    CONVERTING = "converting"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    ERROR = "error"


class TranscriptionJob:
    """전사 작업 관리"""
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.stage = ProcessingStage.DOWNLOADING
        self.progress = 0.0
        self.message = ""
        self.result = None
        self.error = None
        self.start_time = datetime.now()
        self.end_time = None
        
    def to_dict(self) -> Dict:
        return {
            'job_id': self.job_id,
            'stage': self.stage.value,
            'progress': self.progress,
            'message': self.message,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'result': self.result,
            'error': self.error
        }


class TranscriptionService:
    """전사 서비스 메인 클래스"""
    
    def __init__(self):
        self.basic_pitch_service = None
        self.midi_to_tab_converter = None
        self.youtube_processor = None
        self.is_initialized = False
        self.active_jobs = {}  # job_id -> TranscriptionJob
        
    async def initialize(self):
        """서비스 초기화"""
        try:
            # Initialize Basic Pitch service
            config = TranscriptionConfig(
                guitar_mode=True,
                onset_threshold=0.5,
                smooth_notes=True,
                quantize_timing=True
            )
            self.basic_pitch_service = BasicPitchService(config)
            await self.basic_pitch_service.initialize()
            
            # Initialize MIDI to Tab converter
            tab_config = TabConfig(
                tuning=Tuning.STANDARD.value,
                detect_chords=True,
                detect_techniques=True,
                prefer_low_positions=True
            )
            self.midi_to_tab_converter = MidiToTabConverter(tab_config)
            
            # Initialize YouTube processor
            self.youtube_processor = YouTubeProcessor()
            
            self.is_initialized = True
            logger.info("Transcription service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize transcription service: {e}")
            raise
    
    async def process_youtube_url(
        self,
        url: str,
        output_format: str = "tab",
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> str:
        """
        YouTube URL 처리
        
        Returns:
            job_id for tracking progress
        """
        job_id = str(uuid.uuid4())
        job = TranscriptionJob(job_id)
        self.active_jobs[job_id] = job
        
        # Start processing in background
        asyncio.create_task(
            self._process_youtube_job(job, url, output_format, options, progress_callback)
        )
        
        return job_id
    
    async def process_audio_file(
        self,
        audio_path: Union[str, Path],
        output_format: str = "tab",
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> str:
        """
        오디오 파일 처리
        
        Returns:
            job_id for tracking progress
        """
        job_id = str(uuid.uuid4())
        job = TranscriptionJob(job_id)
        self.active_jobs[job_id] = job
        
        # Start processing in background
        asyncio.create_task(
            self._process_audio_job(job, audio_path, output_format, options, progress_callback)
        )
        
        return job_id
    
    async def _process_youtube_job(
        self,
        job: TranscriptionJob,
        url: str,
        output_format: str,
        options: Optional[Dict[str, Any]],
        progress_callback: Optional[Callable[[float, str], None]]
    ):
        """YouTube 작업 처리"""
        try:
            # Stage 1: Download from YouTube
            job.stage = ProcessingStage.DOWNLOADING
            job.message = "Downloading audio from YouTube..."
            
            def download_progress(progress: DownloadProgress):
                job.progress = progress.progress * 0.25  # 25% of total
                job.message = progress.message or "Downloading..."
                if progress_callback:
                    progress_callback(job.progress, job.message)
            
            download_config = DownloadConfig(
                url=url,
                output_format="wav",
                audio_quality="256"
            )
            
            download_result = await self.youtube_processor.download_audio(
                download_config, 
                download_progress
            )
            
            if not download_result['success']:
                raise Exception(f"Download failed: {download_result['error']}")
            
            audio_path = Path(download_result['file_path'])
            
            # Continue with audio processing
            await self._process_audio_stages(
                job, audio_path, output_format, options, progress_callback, 0.25
            )
            
        except Exception as e:
            logger.error(f"Error processing YouTube URL: {e}")
            job.stage = ProcessingStage.ERROR
            job.error = str(e)
            job.end_time = datetime.now()
    
    async def _process_audio_job(
        self,
        job: TranscriptionJob,
        audio_path: Union[str, Path],
        output_format: str,
        options: Optional[Dict[str, Any]],
        progress_callback: Optional[Callable[[float, str], None]]
    ):
        """오디오 파일 작업 처리"""
        try:
            await self._process_audio_stages(
                job, audio_path, output_format, options, progress_callback, 0.0
            )
        except Exception as e:
            logger.error(f"Error processing audio file: {e}")
            job.stage = ProcessingStage.ERROR
            job.error = str(e)
            job.end_time = datetime.now()
    
    async def _process_audio_stages(
        self,
        job: TranscriptionJob,
        audio_path: Union[str, Path],
        output_format: str,
        options: Optional[Dict[str, Any]],
        progress_callback: Optional[Callable[[float, str], None]],
        progress_offset: float
    ):
        """오디오 처리 단계들"""
        
        # Stage 2: Transcribe audio to MIDI
        job.stage = ProcessingStage.TRANSCRIBING
        job.message = "Transcribing audio to MIDI..."
        
        def transcription_progress(progress: float, message: str):
            job.progress = progress_offset + (progress * 0.4)  # 40% of total
            job.message = message
            if progress_callback:
                progress_callback(job.progress, job.message)
        
        self.basic_pitch_service.progress_callback = transcription_progress
        
        # Generate temporary MIDI path
        midi_path = Path(audio_path).with_suffix('.mid')
        
        transcription_result = await self.basic_pitch_service.transcribe_audio(
            audio_path, midi_path
        )
        
        # Stage 3: Convert MIDI to Tab
        job.stage = ProcessingStage.CONVERTING
        job.message = "Converting to guitar tab..."
        job.progress = progress_offset + 0.4 + 0.1  # 50% total
        if progress_callback:
            progress_callback(job.progress, job.message)
        
        tab_result = await self.midi_to_tab_converter.convert_midi_to_tab(
            transcription_result.midi_data
        )
        
        # Stage 4: Analyze music theory
        job.stage = ProcessingStage.ANALYZING
        job.message = "Analyzing music theory..."
        job.progress = progress_offset + 0.4 + 0.2 + 0.1  # 70% total
        if progress_callback:
            progress_callback(job.progress, job.message)
        
        theory_analysis = await self._analyze_theory(midi_path)
        
        # Compile final result
        job.result = {
            'transcription': transcription_result.to_dict(),
            'tab': tab_result,
            'theory': theory_analysis,
            'audio_path': str(audio_path),
            'midi_path': str(midi_path),
            'output_format': output_format
        }
        
        # Complete
        job.stage = ProcessingStage.COMPLETED
        job.progress = 1.0
        job.message = "Processing complete!"
        job.end_time = datetime.now()
        
        if progress_callback:
            progress_callback(job.progress, job.message)
        
        logger.info(f"Job {job.job_id} completed successfully")
    
    async def _analyze_theory(self, midi_path: Path) -> Dict[str, Any]:
        """음악 이론 분석"""
        if not HAS_MUSIC21:
            return {'error': 'music21 not installed'}
            
        try:
            # Load MIDI with music21
            score = converter.parse(str(midi_path))
            
            analysis_result = {
                'key': None,
                'time_signature': None,
                'chord_progression': [],
                'scale_suggestions': []
            }
            
            # Key analysis
            try:
                analyzed_key = score.analyze('key')
                analysis_result['key'] = {
                    'tonic': str(analyzed_key.tonic),
                    'mode': analyzed_key.mode,
                    'confidence': analyzed_key.correlationCoefficient
                }
            except:
                pass
            
            # Time signature
            try:
                ts = score.getTimeSignatures()[0]
                analysis_result['time_signature'] = f"{ts.numerator}/{ts.denominator}"
            except:
                pass
            
            # Basic chord analysis (simplified)
            try:
                chords = score.chordify()
                chord_list = []
                for c in chords.recurse().getElementsByClass('Chord')[:20]:  # First 20 chords
                    chord_list.append({
                        'chord': c.pitchedCommonName,
                        'offset': float(c.offset)
                    })
                analysis_result['chord_progression'] = chord_list
            except:
                pass
            
            # Scale suggestions based on key
            if analysis_result['key']:
                tonic = analysis_result['key']['tonic']
                mode = analysis_result['key']['mode']
                
                if mode == 'major':
                    analysis_result['scale_suggestions'] = [
                        f"{tonic} Major (Ionian)",
                        f"{tonic} Mixolydian",
                        f"{tonic} Major Pentatonic"
                    ]
                else:
                    analysis_result['scale_suggestions'] = [
                        f"{tonic} Natural Minor (Aeolian)",
                        f"{tonic} Dorian",
                        f"{tonic} Minor Pentatonic"
                    ]
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Theory analysis failed: {e}")
            return {'error': str(e)}
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """작업 상태 조회"""
        if job_id not in self.active_jobs:
            return {
                'job_id': job_id,
                'status': 'not_found',
                'error': 'Job ID not found'
            }
        
        job = self.active_jobs[job_id]
        return job.to_dict()
    
    async def cancel_job(self, job_id: str) -> bool:
        """작업 취소"""
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            job.stage = ProcessingStage.ERROR
            job.error = "Job cancelled by user"
            job.end_time = datetime.now()
            logger.info(f"Job {job_id} cancelled")
            return True
        return False
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """오래된 작업 정리"""
        current_time = datetime.now()
        jobs_to_remove = []
        
        for job_id, job in self.active_jobs.items():
            if job.end_time:
                age = current_time - job.end_time
                if age.total_seconds() > max_age_hours * 3600:
                    jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.active_jobs[job_id]
        
        if jobs_to_remove:
            logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")


# 테스트용 코드
if __name__ == "__main__":
    async def test_service():
        service = TranscriptionService()
        await service.initialize()
        
        def progress_callback(progress: float, message: str):
            print(f"[{progress*100:.0f}%] {message}")
        
        # Test with audio file
        test_audio = Path("test_audio.mp3")
        if test_audio.exists():
            job_id = await service.process_audio_file(
                test_audio,
                progress_callback=progress_callback
            )
            
            print(f"Started job: {job_id}")
            
            # Wait for completion
            while True:
                status = await service.get_job_status(job_id)
                if status['stage'] in ['completed', 'error']:
                    print(f"Final status: {json.dumps(status, indent=2)}")
                    break
                await asyncio.sleep(1)
        
        # Test with YouTube URL
        test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        job_id = await service.process_youtube_url(
            test_url,
            progress_callback=progress_callback
        )
        
        print(f"Started YouTube job: {job_id}")
    
    # 비동기 실행
    asyncio.run(test_service())