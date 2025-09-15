"""
YouTube audio download service
"""

import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
import re

import yt_dlp
import ffmpeg

from core.config import settings

class YouTubeService:
    def __init__(self):
        self.temp_dir = Path(settings.TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
        # yt-dlp options
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'extractaudio': True,
            'audioformat': 'mp3',
            'outtmpl': str(self.temp_dir / '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'ffmpeg_location': self._find_ffmpeg(),
        }
    
    def _find_ffmpeg(self) -> Optional[str]:
        """Find FFmpeg executable"""
        import shutil
        ffmpeg_path = shutil.which('ffmpeg')
        if ffmpeg_path:
            return os.path.dirname(ffmpeg_path)
        return None
    
    def _extract_video_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL"""
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed\/)([0-9A-Za-z_-]{11})',
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    async def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Get YouTube video information
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary containing video metadata
        """
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                
                return {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'description': info.get('description', ''),
                    'thumbnail': info.get('thumbnail', ''),
                    'upload_date': info.get('upload_date', ''),
                    'video_id': info.get('id', ''),
                    'url': url
                }
        except Exception as e:
            raise ValueError(f"Failed to get video info: {str(e)}")
    
    async def download_audio(
        self,
        url: str,
        output_format: str = 'mp3',
        quality: str = 'best'
    ) -> Path:
        """
        Download audio from YouTube video
        
        Args:
            url: YouTube video URL
            output_format: Output audio format (mp3, wav, etc.)
            quality: Audio quality (best, 192, 128, etc.)
            
        Returns:
            Path to downloaded audio file
        """
        try:
            # Extract video ID
            video_id = self._extract_video_id(url)
            if not video_id:
                raise ValueError("Invalid YouTube URL")
            
            # Check if already downloaded
            output_file = self.temp_dir / f"{video_id}.{output_format}"
            if output_file.exists():
                return output_file
            
            # Update options for this download
            opts = self.ydl_opts.copy()
            if quality != 'best':
                opts['postprocessors'][0]['preferredquality'] = quality
            if output_format != 'mp3':
                opts['postprocessors'][0]['preferredcodec'] = output_format
            
            # Download audio
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
                # Find downloaded file
                downloaded_file = self.temp_dir / f"{info['id']}.{output_format}"
                if not downloaded_file.exists():
                    # Sometimes the extension is different
                    for file in self.temp_dir.glob(f"{info['id']}.*"):
                        if file.suffix in ['.mp3', '.m4a', '.wav', '.opus']:
                            downloaded_file = file
                            break
                
                if not downloaded_file.exists():
                    raise FileNotFoundError("Downloaded file not found")
                
                # Convert to desired format if needed
                if downloaded_file.suffix[1:] != output_format:
                    output_file = self.temp_dir / f"{video_id}.{output_format}"
                    await self._convert_audio(downloaded_file, output_file, output_format)
                    downloaded_file.unlink()  # Remove original
                    return output_file
                
                return downloaded_file
                
        except Exception as e:
            raise ValueError(f"Failed to download audio: {str(e)}")
    
    async def _convert_audio(
        self,
        input_file: Path,
        output_file: Path,
        output_format: str
    ) -> None:
        """
        Convert audio file to different format using FFmpeg
        
        Args:
            input_file: Input audio file path
            output_file: Output audio file path
            output_format: Target audio format
        """
        try:
            stream = ffmpeg.input(str(input_file))
            stream = ffmpeg.output(stream, str(output_file))
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
        except Exception as e:
            raise ValueError(f"Failed to convert audio: {str(e)}")
    
    async def extract_audio_segment(
        self,
        audio_path: Path,
        start_time: float,
        end_time: float
    ) -> Path:
        """
        Extract a segment from audio file
        
        Args:
            audio_path: Path to audio file
            start_time: Start time in seconds
            end_time: End time in seconds
            
        Returns:
            Path to extracted segment
        """
        try:
            output_file = self.temp_dir / f"segment_{start_time}_{end_time}.mp3"
            
            stream = ffmpeg.input(str(audio_path), ss=start_time, t=(end_time - start_time))
            stream = ffmpeg.output(stream, str(output_file))
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            
            return output_file
        except Exception as e:
            raise ValueError(f"Failed to extract segment: {str(e)}")
    
    def cleanup_temp_files(self, older_than_hours: int = 24) -> int:
        """
        Clean up old temporary files
        
        Args:
            older_than_hours: Remove files older than this many hours
            
        Returns:
            Number of files removed
        """
        import time
        
        current_time = time.time()
        cutoff_time = current_time - (older_than_hours * 3600)
        removed_count = 0
        
        for file_path in self.temp_dir.glob("*"):
            if file_path.is_file():
                file_stat = file_path.stat()
                if file_stat.st_mtime < cutoff_time:
                    try:
                        file_path.unlink()
                        removed_count += 1
                    except Exception:
                        pass
        
        return removed_count
    
    async def validate_url(self, url: str) -> bool:
        """
        Validate if URL is a valid YouTube URL
        
        Args:
            url: URL to validate
            
        Returns:
            True if valid YouTube URL, False otherwise
        """
        youtube_patterns = [
            r'(https?://)?(www\.)?(youtube\.com|youtu\.be)/',
            r'(https?://)?(www\.)?(m\.youtube\.com)/',
        ]
        
        for pattern in youtube_patterns:
            if re.match(pattern, url):
                return True
        
        return False
    
    async def get_audio_duration(self, audio_path: Path) -> float:
        """
        Get duration of audio file in seconds
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Duration in seconds
        """
        try:
            probe = ffmpeg.probe(str(audio_path))
            duration = float(probe['streams'][0]['duration'])
            return duration
        except Exception as e:
            raise ValueError(f"Failed to get audio duration: {str(e)}")