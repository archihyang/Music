"""
YouTube download service for extracting audio from YouTube videos
"""
import os
import re
from pathlib import Path
from typing import Optional, Dict, Any
import yt_dlp
from loguru import logger

from config import settings
from services.audio_processor import AudioProcessor


class YouTubeDownloader:
    """
    Service for downloading and processing YouTube videos
    """
    
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.output_dir = settings.upload_dir / "youtube"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # yt-dlp options
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
                'preferredquality': '192',
            }],
            'outtmpl': str(self.output_dir / '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'logtostderr': False,
            'no_color': True,
        }
    
    def validate_url(self, url: str) -> bool:
        """
        Validate YouTube URL
        
        Args:
            url: YouTube URL
            
        Returns:
            True if valid YouTube URL
        """
        youtube_regex = re.compile(
            r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
            r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
        )
        return bool(youtube_regex.match(url))
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """
        Extract video ID from YouTube URL
        
        Args:
            url: YouTube URL
            
        Returns:
            Video ID or None
        """
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed\/)([0-9A-Za-z_-]{11})',
            r'(?:watch\?v=)([0-9A-Za-z_-]{11})',
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Get video metadata without downloading
        
        Args:
            url: YouTube URL
            
        Returns:
            Video metadata dictionary
        """
        if not self.validate_url(url):
            raise ValueError(f"Invalid YouTube URL: {url}")
        
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                
                return {
                    'id': info.get('id'),
                    'title': info.get('title'),
                    'duration': info.get('duration'),
                    'uploader': info.get('uploader'),
                    'upload_date': info.get('upload_date'),
                    'view_count': info.get('view_count'),
                    'like_count': info.get('like_count'),
                    'description': info.get('description'),
                    'thumbnail': info.get('thumbnail'),
                    'categories': info.get('categories', []),
                    'tags': info.get('tags', []),
                }
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            raise
    
    def download_audio(
        self,
        url: str,
        output_format: str = 'wav',
        start_time: Optional[int] = None,
        end_time: Optional[int] = None
    ) -> Path:
        """
        Download audio from YouTube video
        
        Args:
            url: YouTube URL
            output_format: Output audio format
            start_time: Start time in seconds (optional)
            end_time: End time in seconds (optional)
            
        Returns:
            Path to downloaded audio file
        """
        if not self.validate_url(url):
            raise ValueError(f"Invalid YouTube URL: {url}")
        
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError(f"Could not extract video ID from URL: {url}")
        
        output_path = self.output_dir / f"{video_id}.{output_format}"
        
        # Check if already downloaded
        if output_path.exists():
            logger.info(f"Audio already downloaded: {output_path}")
            return output_path
        
        try:
            # Customize options for this download
            opts = self.ydl_opts.copy()
            
            # Add time range if specified
            if start_time is not None or end_time is not None:
                postprocessor_args = []
                if start_time is not None:
                    postprocessor_args.extend(['-ss', str(start_time)])
                if end_time is not None:
                    postprocessor_args.extend(['-to', str(end_time)])
                
                opts['postprocessor_args'] = {
                    'FFmpegExtractAudio': postprocessor_args
                }
            
            # Update output format
            opts['postprocessors'][0]['preferredcodec'] = output_format
            
            # Download
            with yt_dlp.YoutubeDL(opts) as ydl:
                logger.info(f"Downloading audio from: {url}")
                ydl.download([url])
            
            # Find the downloaded file
            downloaded_files = list(self.output_dir.glob(f"{video_id}.*"))
            if not downloaded_files:
                raise FileNotFoundError(f"Downloaded file not found for video ID: {video_id}")
            
            output_path = downloaded_files[0]
            logger.info(f"Audio downloaded successfully: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error downloading audio: {e}")
            raise
    
    def download_and_process(
        self,
        url: str,
        normalize: bool = True,
        trim_silence: bool = True,
        target_sr: int = None
    ) -> tuple[Path, Dict[str, Any]]:
        """
        Download audio and apply preprocessing
        
        Args:
            url: YouTube URL
            normalize: Whether to normalize audio
            trim_silence: Whether to trim silence
            target_sr: Target sample rate
            
        Returns:
            Tuple of (processed audio path, video metadata)
        """
        # Get video info
        video_info = self.get_video_info(url)
        
        # Download audio
        raw_audio_path = self.download_audio(url)
        
        # Load audio
        audio, sr = self.audio_processor.load_audio(raw_audio_path)
        
        # Process audio
        if trim_silence:
            audio = self.audio_processor.trim_silence(audio, sr)
        
        if normalize:
            audio = self.audio_processor.normalize(audio)
        
        if target_sr and target_sr != sr:
            audio = self.audio_processor.resample(audio, sr, target_sr)
            sr = target_sr
        
        # Save processed audio
        video_id = video_info['id']
        processed_path = self.output_dir / f"{video_id}_processed.wav"
        self.audio_processor.save_audio(audio, processed_path, sr)
        
        logger.info(f"Audio processed and saved: {processed_path}")
        
        return processed_path, video_info
    
    def extract_segment(
        self,
        url: str,
        start_time: float,
        end_time: float,
        output_format: str = 'wav'
    ) -> Path:
        """
        Extract a specific segment from YouTube video
        
        Args:
            url: YouTube URL
            start_time: Start time in seconds
            end_time: End time in seconds
            output_format: Output format
            
        Returns:
            Path to extracted segment
        """
        # Download the segment
        audio_path = self.download_audio(url, output_format, start_time, end_time)
        
        return audio_path
    
    def batch_download(
        self,
        urls: list[str],
        output_format: str = 'wav'
    ) -> list[Path]:
        """
        Download multiple YouTube videos
        
        Args:
            urls: List of YouTube URLs
            output_format: Output format
            
        Returns:
            List of downloaded file paths
        """
        downloaded_files = []
        
        for url in urls:
            try:
                audio_path = self.download_audio(url, output_format)
                downloaded_files.append(audio_path)
            except Exception as e:
                logger.error(f"Failed to download {url}: {e}")
                continue
        
        return downloaded_files
    
    def cleanup_downloads(self, older_than_days: int = 7):
        """
        Clean up old downloaded files
        
        Args:
            older_than_days: Delete files older than this many days
        """
        import time
        from datetime import datetime, timedelta
        
        cutoff_time = time.time() - (older_than_days * 24 * 60 * 60)
        
        for file_path in self.output_dir.iterdir():
            if file_path.is_file():
                file_age = file_path.stat().st_mtime
                if file_age < cutoff_time:
                    try:
                        file_path.unlink()
                        logger.info(f"Deleted old file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting file {file_path}: {e}")