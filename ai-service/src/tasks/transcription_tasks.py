"""
Celery tasks for music transcription and analysis
"""
import json
from pathlib import Path
from typing import Dict, Any
from celery import Task
from loguru import logger

from tasks.celery_app import celery_app
from services.youtube_downloader import YouTubeDownloader
from services.transcription_service import TranscriptionService
from services.style_analyzer import StyleAnalyzer
from config import settings


class CallbackTask(Task):
    """Task with progress callback support"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Success callback"""
        logger.info(f"Task {task_id} completed successfully")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Failure callback"""
        logger.error(f"Task {task_id} failed: {exc}")


@celery_app.task(bind=True, base=CallbackTask, name='transcribe_youtube')
def transcribe_youtube_task(
    self,
    job_id: str,
    transcription_id: str,
    url: str,
    user_id: str,
    instrument: str = 'guitar',
    difficulty: str = 'INTERMEDIATE',
    style: str = None
) -> Dict[str, Any]:
    """
    Async task to transcribe YouTube video
    
    Args:
        job_id: Unique job ID
        transcription_id: Database transcription ID
        url: YouTube URL
        user_id: User ID
        instrument: Target instrument
        difficulty: Difficulty level
        style: Specific style to analyze
    
    Returns:
        Transcription results
    """
    try:
        # Update task state
        self.update_state(
            state='DOWNLOADING',
            meta={'progress': 10, 'message': 'Downloading YouTube audio'}
        )
        
        # Initialize services
        youtube_service = YouTubeDownloader()
        transcription_service = TranscriptionService()
        style_analyzer = StyleAnalyzer()
        
        # Download and process audio
        logger.info(f"Downloading YouTube video: {url}")
        audio_path, video_info = youtube_service.download_and_process(
            url,
            normalize=True,
            trim_silence=True,
            target_sr=settings.sample_rate
        )
        
        # Update progress
        self.update_state(
            state='TRANSCRIBING',
            meta={'progress': 30, 'message': 'Transcribing audio to MIDI'}
        )
        
        # Transcribe audio
        logger.info(f"Transcribing audio: {audio_path}")
        transcription_result = transcription_service.transcribe_audio(
            audio_path,
            onset_threshold=0.5,
            frame_threshold=0.3
        )
        
        # Update progress
        self.update_state(
            state='ANALYZING',
            meta={'progress': 60, 'message': 'Analyzing musical style'}
        )
        
        # Analyze style
        logger.info("Analyzing musical style")
        style_analysis = style_analyzer.analyze_style(
            transcription_result['midi_data']
        )
        
        # Update progress
        self.update_state(
            state='GENERATING',
            meta={'progress': 80, 'message': 'Generating tablature and notation'}
        )
        
        # Generate tablature
        tab_data = transcription_service.midi_to_tab(
            transcription_result['midi_data']
        )
        
        # Save results
        output_dir = settings.transcription_output_dir / job_id
        output_files = transcription_service.save_transcription(
            transcription_result,
            output_dir,
            video_info['id']
        )
        
        # Prepare final result
        result = {
            'job_id': job_id,
            'transcription_id': transcription_id,
            'status': 'COMPLETED',
            'video_info': video_info,
            'transcription': {
                'notes': transcription_result['notes'],
                'tempo': transcription_result['tempo'],
                'key': transcription_result['key'],
                'time_signature': transcription_result['time_signature']
            },
            'style_analysis': style_analysis,
            'tab_data': tab_data,
            'output_files': {
                key: str(path) for key, path in output_files.items()
            }
        }
        
        # Update final progress
        self.update_state(
            state='COMPLETED',
            meta={'progress': 100, 'message': 'Transcription complete'}
        )
        
        logger.info(f"Transcription completed for job {job_id}")
        return result
        
    except Exception as e:
        logger.error(f"Transcription task failed: {e}")
        self.update_state(
            state='FAILED',
            meta={'progress': 0, 'message': str(e)}
        )
        raise


@celery_app.task(bind=True, base=CallbackTask, name='transcribe_file')
def transcribe_file_task(
    self,
    job_id: str,
    transcription_id: str,
    file_path: str,
    user_id: str,
    instrument: str = 'guitar',
    difficulty: str = 'INTERMEDIATE',
    style: str = None
) -> Dict[str, Any]:
    """
    Async task to transcribe uploaded audio file
    
    Args:
        job_id: Unique job ID
        transcription_id: Database transcription ID
        file_path: Path to uploaded file
        user_id: User ID
        instrument: Target instrument
        difficulty: Difficulty level
        style: Specific style to analyze
    
    Returns:
        Transcription results
    """
    try:
        # Update task state
        self.update_state(
            state='PROCESSING',
            meta={'progress': 10, 'message': 'Processing audio file'}
        )
        
        # Initialize services
        transcription_service = TranscriptionService()
        style_analyzer = StyleAnalyzer()
        
        file_path = Path(file_path)
        
        # Update progress
        self.update_state(
            state='TRANSCRIBING',
            meta={'progress': 30, 'message': 'Transcribing audio to MIDI'}
        )
        
        # Transcribe audio
        logger.info(f"Transcribing audio file: {file_path}")
        transcription_result = transcription_service.transcribe_audio(
            file_path,
            onset_threshold=0.5,
            frame_threshold=0.3
        )
        
        # Update progress
        self.update_state(
            state='ANALYZING',
            meta={'progress': 60, 'message': 'Analyzing musical style'}
        )
        
        # Analyze style
        logger.info("Analyzing musical style")
        style_analysis = style_analyzer.analyze_style(
            transcription_result['midi_data']
        )
        
        # Update progress
        self.update_state(
            state='GENERATING',
            meta={'progress': 80, 'message': 'Generating tablature and notation'}
        )
        
        # Generate tablature
        tab_data = transcription_service.midi_to_tab(
            transcription_result['midi_data']
        )
        
        # Save results
        output_dir = settings.transcription_output_dir / job_id
        output_files = transcription_service.save_transcription(
            transcription_result,
            output_dir,
            file_path.stem
        )
        
        # Prepare final result
        result = {
            'job_id': job_id,
            'transcription_id': transcription_id,
            'status': 'COMPLETED',
            'file_info': {
                'filename': file_path.name,
                'size': file_path.stat().st_size
            },
            'transcription': {
                'notes': transcription_result['notes'],
                'tempo': transcription_result['tempo'],
                'key': transcription_result['key'],
                'time_signature': transcription_result['time_signature']
            },
            'style_analysis': style_analysis,
            'tab_data': tab_data,
            'output_files': {
                key: str(path) for key, path in output_files.items()
            }
        }
        
        # Update final progress
        self.update_state(
            state='COMPLETED',
            meta={'progress': 100, 'message': 'Transcription complete'}
        )
        
        logger.info(f"File transcription completed for job {job_id}")
        return result
        
    except Exception as e:
        logger.error(f"File transcription task failed: {e}")
        self.update_state(
            state='FAILED',
            meta={'progress': 0, 'message': str(e)}
        )
        raise


@celery_app.task(bind=True, name='analyze_style')
def analyze_style_task(
    self,
    midi_file_path: str,
    audio_file_path: str = None
) -> Dict[str, Any]:
    """
    Analyze musical style from MIDI and optional audio
    
    Args:
        midi_file_path: Path to MIDI file
        audio_file_path: Optional path to audio file
    
    Returns:
        Style analysis results
    """
    try:
        import pretty_midi
        
        # Load MIDI
        midi_data = pretty_midi.PrettyMIDI(midi_file_path)
        
        # Initialize analyzer
        style_analyzer = StyleAnalyzer()
        
        # Extract audio features if provided
        audio_features = None
        if audio_file_path:
            from services.audio_processor import AudioProcessor
            processor = AudioProcessor()
            audio, sr = processor.load_audio(audio_file_path)
            audio_features = processor.extract_features(audio, sr)
        
        # Analyze style
        analysis = style_analyzer.analyze_style(midi_data, audio_features)
        
        return analysis
        
    except Exception as e:
        logger.error(f"Style analysis task failed: {e}")
        raise


@celery_app.task(name='cleanup_old_files')
def cleanup_old_files_task(days: int = 7):
    """
    Clean up old transcription files
    
    Args:
        days: Delete files older than this many days
    """
    try:
        youtube_service = YouTubeDownloader()
        youtube_service.cleanup_downloads(days)
        
        # Clean up old transcription outputs
        import time
        from datetime import datetime, timedelta
        
        cutoff_time = time.time() - (days * 24 * 60 * 60)
        
        for file_path in settings.transcription_output_dir.rglob('*'):
            if file_path.is_file():
                file_age = file_path.stat().st_mtime
                if file_age < cutoff_time:
                    try:
                        file_path.unlink()
                        logger.info(f"Deleted old file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting file {file_path}: {e}")
        
        logger.info("Cleanup task completed")
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        raise