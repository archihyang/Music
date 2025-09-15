"""
YouTube Audio Download & Processing Module
Genesis Music - AI 기반 기타 학습 플랫폼

주요 기능:
- YouTube URL에서 오디오 추출
- 오디오 포맷 변환 (MP3, WAV)
- 메타데이터 추출 및 저장
- 다운로드 진행률 추적
"""

import os
import re
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, Optional, Any, Callable
from datetime import datetime

import yt_dlp
import ffmpeg
from pydantic import BaseModel, Field, HttpUrl

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoMetadata(BaseModel):
    """비디오 메타데이터 모델"""
    video_id: str
    title: str
    channel: str
    duration: int  # seconds
    upload_date: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    view_count: Optional[int] = None

class DownloadConfig(BaseModel):
    """다운로드 설정 모델"""
    url: HttpUrl
    output_format: str = Field(default="mp3", pattern="^(mp3|wav|flac)$")
    output_dir: Path = Field(default=Path("downloads"))
    audio_quality: str = Field(default="192", pattern="^(128|192|256|320)$")
    keep_video: bool = False
    extract_metadata: bool = True

class DownloadProgress(BaseModel):
    """다운로드 진행률 모델"""
    status: str = Field(default="pending")
    progress: float = Field(default=0.0, ge=0.0, le=100.0)
    speed: Optional[str] = None
    eta: Optional[int] = None
    filesize: Optional[int] = None
    message: Optional[str] = None
    error: Optional[str] = None


class YouTubeProcessor:
    """YouTube 오디오 처리 클래스"""
    
    def __init__(self, output_dir: str = "downloads"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.current_progress = DownloadProgress()
        self.progress_callback = None
        
    def _progress_hook(self, d: Dict[str, Any]):
        """yt-dlp 진행률 콜백"""
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            downloaded = d.get('downloaded_bytes', 0)
            
            if total > 0:
                progress = (downloaded / total) * 100
                self.current_progress.progress = min(progress, 100.0)
                self.current_progress.status = "downloading"
                self.current_progress.speed = d.get('speed_str', 'N/A')
                self.current_progress.eta = d.get('eta')
                self.current_progress.filesize = total
                self.current_progress.message = f"Downloading: {progress:.1f}%"
                
                if self.progress_callback:
                    self.progress_callback(self.current_progress)
                    
        elif d['status'] == 'finished':
            self.current_progress.status = "processing"
            self.current_progress.progress = 100.0
            self.current_progress.message = "Download complete, processing audio..."
            
            if self.progress_callback:
                self.progress_callback(self.current_progress)
    
    def _get_ydl_opts(self, config: DownloadConfig) -> Dict[str, Any]:
        """yt-dlp 옵션 생성"""
        output_template = str(self.output_dir / '%(title)s.%(ext)s')
        
        return {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'progress_hooks': [self._progress_hook],
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': config.output_format,
                'preferredquality': config.audio_quality,
            }],
            'keepvideo': config.keep_video,
        }
    
    def extract_metadata(self, url: str) -> Optional[VideoMetadata]:
        """비디오 메타데이터 추출"""
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if info:
                    return VideoMetadata(
                        video_id=info.get('id', ''),
                        title=info.get('title', 'Unknown'),
                        channel=info.get('uploader', 'Unknown'),
                        duration=info.get('duration', 0),
                        upload_date=info.get('upload_date'),
                        description=info.get('description'),
                        thumbnail=info.get('thumbnail'),
                        view_count=info.get('view_count')
                    )
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            return None
    
    async def download_audio(
        self,
        config: DownloadConfig,
        progress_callback: Optional[Callable[[DownloadProgress], None]] = None
    ) -> Dict[str, Any]:
        """YouTube 비디오에서 오디오 다운로드"""
        self.progress_callback = progress_callback
        result = {
            'success': False,
            'file_path': None,
            'metadata': None,
            'error': None
        }
        
        try:
            # 메타데이터 추출
            if config.extract_metadata:
                metadata = self.extract_metadata(str(config.url))
                result['metadata'] = metadata.dict() if metadata else None
            
            # 다운로드 옵션 설정
            ydl_opts = self._get_ydl_opts(config)
            
            # 다운로드 실행
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(str(config.url), download=True)
                
                # 출력 파일 경로 생성
                title = info.get('title', 'audio').replace('/', '_')
                output_file = self.output_dir / f"{title}.{config.output_format}"
                
                if output_file.exists():
                    result['success'] = True
                    result['file_path'] = str(output_file)
                    
                    # 오디오 정보 추출
                    result['audio_info'] = await self.get_audio_info(output_file)
                    
                    self.current_progress.status = "completed"
                    self.current_progress.message = "Audio download successful"
                    
                    if self.progress_callback:
                        self.progress_callback(self.current_progress)
                else:
                    raise FileNotFoundError(f"Output file not found: {output_file}")
                    
        except Exception as e:
            logger.error(f"Download failed: {e}")
            result['error'] = str(e)
            
            self.current_progress.status = "error"
            self.current_progress.error = str(e)
            self.current_progress.message = f"Download failed: {e}"
            
            if self.progress_callback:
                self.progress_callback(self.current_progress)
        
        return result
    
    async def get_audio_info(self, file_path: Path) -> Dict[str, Any]:
        """오디오 파일 정보 추출"""
        try:
            probe = ffmpeg.probe(str(file_path))
            audio_stream = next(
                (stream for stream in probe['streams'] if stream['codec_type'] == 'audio'),
                None
            )
            
            if audio_stream:
                return {
                    'codec': audio_stream.get('codec_name'),
                    'sample_rate': audio_stream.get('sample_rate'),
                    'channels': audio_stream.get('channels'),
                    'duration': float(audio_stream.get('duration', 0)),
                    'bitrate': audio_stream.get('bit_rate'),
                    'filesize': os.path.getsize(file_path)
                }
        except Exception as e:
            logger.error(f"Failed to get audio info: {e}")
            
        return {}
    
    def cleanup_downloads(self, days_old: int = 7):
        """오래된 다운로드 파일 정리"""
        import time
        current_time = time.time()
        
        for file_path in self.output_dir.glob('*'):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > (days_old * 24 * 3600):
                    try:
                        file_path.unlink()
                        logger.info(f"Deleted old file: {file_path}")
                    except Exception as e:
                        logger.error(f"Failed to delete {file_path}: {e}")


# Async wrapper for use in FastAPI
async def process_youtube_url(
    url: str,
    output_format: str = "mp3",
    audio_quality: str = "192",
    progress_callback: Optional[Callable[[DownloadProgress], None]] = None
) -> Dict[str, Any]:
    """YouTube URL 처리 헬퍼 함수"""
    processor = YouTubeProcessor()
    
    config = DownloadConfig(
        url=url,
        output_format=output_format,
        audio_quality=audio_quality,
        extract_metadata=True
    )
    
    return await processor.download_audio(config, progress_callback)


# CLI 테스트용
if __name__ == "__main__":
    import sys
    
    async def test_download():
        if len(sys.argv) < 2:
            print("Usage: python youtube_processor.py <youtube_url>")
            sys.exit(1)
        
        url = sys.argv[1]
        
        def progress_callback(progress: DownloadProgress):
            print(f"\r{progress.message} - {progress.progress:.1f}%", end="")
        
        print(f"Downloading from: {url}")
        result = await process_youtube_url(url, progress_callback=progress_callback)
        
        if result['success']:
            print(f"\nSuccess! File saved to: {result['file_path']}")
            if result.get('metadata'):
                print(f"Title: {result['metadata']['title']}")
                print(f"Duration: {result['metadata']['duration']}s")
        else:
            print(f"\nFailed: {result['error']}")
    
    asyncio.run(test_download())