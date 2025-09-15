"""
YouTube Streaming Analysis System
다운로드 없이 실시간 YouTube 음악 분석
"""

import asyncio
import numpy as np
from typing import Dict, List, Optional, AsyncGenerator, Tuple
import yt_dlp
import librosa
import requests
from io import BytesIO
import tempfile
import os
from dataclasses import dataclass
import json
from datetime import datetime, timedelta

@dataclass
class StreamChunk:
    """스트림 청크 데이터"""
    data: np.ndarray
    sample_rate: int
    start_time: float
    end_time: float
    chunk_id: int


@dataclass
class StreamAnalysis:
    """스트림 분석 결과"""
    timestamp: float
    notes: List[Dict]
    chords: List[str]
    tempo: float
    key: str
    confidence: float
    techniques: List[str]
    difficulty: int


class YouTubeStreamAnalyzer:
    """YouTube 스트리밍 분석기 - 다운로드 없이 실시간 분석"""
    
    def __init__(self):
        self.chunk_duration = 30.0  # 30초 청크
        self.overlap_duration = 5.0  # 5초 오버랩
        self.sample_rate = 22050    # 분석용 샘플링 레이트
        self.buffer_size = 4096     # FFT 버퍼 크기
        self.max_memory_mb = 100    # 최대 메모리 사용량
        
        # 분석 모델들
        self.pitch_analyzer = None
        self.chord_analyzer = None
        self.tempo_analyzer = None
        
        # 스트리밍 상태
        self.is_analyzing = False
        self.current_position = 0.0
        self.total_duration = 0.0
        self.analysis_history = []
        
    def get_stream_info(self, youtube_url: str) -> Dict:
        """YouTube URL에서 스트리밍 정보 추출 (다운로드 없이)"""
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extractaudio': False,
            'format': 'bestaudio/best',
            'noplaylist': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(youtube_url, download=False)
                
                stream_info = {
                    'title': info.get('title', 'Unknown'),
                    'artist': info.get('uploader', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'stream_url': None,
                    'thumbnail': info.get('thumbnail'),
                    'description': info.get('description', ''),
                    'view_count': info.get('view_count', 0)
                }
                
                # 오디오 스트림 URL 찾기
                for format_info in info.get('formats', []):
                    if format_info.get('acodec') != 'none':
                        stream_info['stream_url'] = format_info.get('url')
                        break
                
                self.total_duration = stream_info['duration']
                return stream_info
                
        except Exception as e:
            raise Exception(f"Failed to extract stream info: {str(e)}")
    
    async def analyze_stream(self, 
                           youtube_url: str,
                           progress_callback: Optional[callable] = None) -> AsyncGenerator[StreamAnalysis, None]:
        """YouTube 스트림 실시간 분석"""
        
        # 스트림 정보 추출
        stream_info = self.get_stream_info(youtube_url)
        stream_url = stream_info['stream_url']
        
        if not stream_url:
            raise Exception("No audio stream found")
        
        self.is_analyzing = True
        chunk_id = 0
        analysis_buffer = []
        
        try:
            # 청크 단위로 스트리밍 분석
            async for chunk in self._stream_audio_chunks(stream_url):
                if not self.is_analyzing:
                    break
                
                # 청크 분석
                analysis = await self._analyze_chunk(chunk)
                analysis_buffer.append(analysis)
                
                # 진행률 콜백
                if progress_callback:
                    progress = (chunk.end_time / self.total_duration) * 100
                    await progress_callback({
                        'progress': progress,
                        'current_time': chunk.end_time,
                        'total_time': self.total_duration,
                        'analysis': analysis
                    })
                
                # 분석 결과 yield
                yield analysis
                
                # 메모리 관리
                if len(analysis_buffer) > 10:  # 최근 10개 청크만 유지
                    analysis_buffer.pop(0)
                
                chunk_id += 1
                
        except Exception as e:
            self.is_analyzing = False
            raise Exception(f"Stream analysis failed: {str(e)}")
        
        finally:
            self.is_analyzing = False
    
    async def _stream_audio_chunks(self, stream_url: str) -> AsyncGenerator[StreamChunk, None]:
        """오디오 스트림을 청크 단위로 처리"""
        
        chunk_size_bytes = int(self.chunk_duration * self.sample_rate * 4)  # 4 bytes per float32
        overlap_bytes = int(self.overlap_duration * self.sample_rate * 4)
        
        current_time = 0.0
        chunk_id = 0
        buffer = bytearray()
        
        try:
            # HTTP 스트리밍
            async with self._get_audio_stream(stream_url) as stream:
                async for data_chunk in stream:
                    buffer.extend(data_chunk)
                    
                    # 충분한 데이터가 쌓이면 처리
                    while len(buffer) >= chunk_size_bytes:
                        # 청크 추출
                        chunk_bytes = buffer[:chunk_size_bytes]
                        
                        # numpy 배열로 변환
                        try:
                            audio_data = np.frombuffer(chunk_bytes, dtype=np.float32)
                            
                            # 오디오 청크 생성
                            chunk = StreamChunk(
                                data=audio_data,
                                sample_rate=self.sample_rate,
                                start_time=current_time,
                                end_time=current_time + self.chunk_duration,
                                chunk_id=chunk_id
                            )
                            
                            yield chunk
                            
                            current_time += self.chunk_duration - self.overlap_duration
                            chunk_id += 1
                            
                            # 오버랩을 위해 일부 데이터 보존
                            buffer = buffer[chunk_size_bytes - overlap_bytes:]
                            
                        except Exception as e:
                            print(f"Error processing audio chunk: {e}")
                            buffer = buffer[chunk_size_bytes:]
                            continue
                    
                    # 메모리 제한 체크
                    if len(buffer) > self.max_memory_mb * 1024 * 1024:
                        buffer = buffer[-overlap_bytes:]  # 오버랩 부분만 유지
                        
        except Exception as e:
            print(f"Streaming error: {e}")
            raise
    
    async def _get_audio_stream(self, stream_url: str):
        """HTTP 오디오 스트림 획득"""
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Range': 'bytes=0-'  # 스트리밍 지원
        }
        
        # 실제 구현에서는 aiohttp나 httpx 사용
        class MockAsyncStream:
            def __init__(self, url, headers):
                self.url = url
                self.headers = headers
                self._response = None
            
            async def __aenter__(self):
                # 실제로는 aiohttp.ClientSession 사용
                return self
            
            async def __aexit__(self, *args):
                if self._response:
                    self._response.close()
            
            async def __aiter__(self):
                # 실제 HTTP 스트리밍 구현
                # 여기서는 시뮬레이션
                chunk_size = 8192
                for i in range(1000):  # 시뮬레이션
                    # 실제로는 response.content.iter_chunked(chunk_size)
                    yield np.random.random(chunk_size).astype(np.float32).tobytes()
                    await asyncio.sleep(0.01)  # 네트워크 지연 시뮬레이션
        
        return MockAsyncStream(stream_url, headers)
    
    async def _analyze_chunk(self, chunk: StreamChunk) -> StreamAnalysis:
        """오디오 청크 분석"""
        
        audio_data = chunk.data
        
        # 기본 전처리
        if len(audio_data) == 0:
            return self._empty_analysis(chunk.start_time)
        
        # 노이즈 제거
        audio_data = self._denoise(audio_data)
        
        # 피치 분석
        notes = await self._detect_notes(audio_data, chunk.sample_rate)
        
        # 코드 분석
        chords = await self._detect_chords(audio_data, chunk.sample_rate)
        
        # 템포 분석
        tempo = await self._detect_tempo(audio_data, chunk.sample_rate)
        
        # 키 분석
        key = await self._detect_key(audio_data, notes)
        
        # 테크닉 분석
        techniques = await self._detect_techniques(audio_data, notes)
        
        # 난이도 평가
        difficulty = self._calculate_difficulty(notes, chords, techniques)
        
        # 신뢰도 계산
        confidence = self._calculate_confidence(notes, chords, tempo)
        
        return StreamAnalysis(
            timestamp=chunk.start_time,
            notes=notes,
            chords=chords,
            tempo=tempo,
            key=key,
            confidence=confidence,
            techniques=techniques,
            difficulty=difficulty
        )
    
    def _denoise(self, audio_data: np.ndarray) -> np.ndarray:
        """간단한 노이즈 제거"""
        # 실제로는 더 정교한 노이즈 제거 알고리즘 사용
        return librosa.effects.preemphasis(audio_data)
    
    async def _detect_notes(self, audio: np.ndarray, sr: int) -> List[Dict]:
        """노트 감지 (간소화된 버전)"""
        
        # 짧은 청크에서는 기본적인 피치 추출만 수행
        try:
            # Harmonic-percussive separation
            harmonic, percussive = librosa.effects.hpss(audio)
            
            # 피치 추출
            pitches, magnitudes = librosa.piptrack(y=harmonic, sr=sr, threshold=0.1)
            
            notes = []
            hop_length = 512
            times = librosa.frames_to_time(np.arange(pitches.shape[1]), sr=sr, hop_length=hop_length)
            
            for t, time_point in enumerate(times):
                if t >= pitches.shape[1]:
                    break
                    
                # 가장 강한 피치 찾기
                max_mag_idx = np.argmax(magnitudes[:, t])
                if magnitudes[max_mag_idx, t] > 0.1:
                    pitch_hz = pitches[max_mag_idx, t]
                    if pitch_hz > 80:  # 기타 음역대
                        note_info = {
                            'time': time_point,
                            'pitch': pitch_hz,
                            'note_name': librosa.hz_to_note(pitch_hz),
                            'confidence': float(magnitudes[max_mag_idx, t])
                        }
                        notes.append(note_info)
            
            return notes[:50]  # 최대 50개 노트 (메모리 절약)
            
        except Exception as e:
            print(f"Note detection error: {e}")
            return []
    
    async def _detect_chords(self, audio: np.ndarray, sr: int) -> List[str]:
        """코드 감지 (간소화된 버전)"""
        
        try:
            # 크로마 특징 추출
            chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
            
            # 간단한 코드 매칭
            chord_templates = {
                'C': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
                'Dm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                'Em': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
                'F': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                'G': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                'Am': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
                'Bdim': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0]
            }
            
            detected_chords = []
            
            # 시간 프레임별 코드 감지
            for i in range(min(10, chroma.shape[1])):  # 최대 10프레임
                frame_chroma = chroma[:, i]
                
                best_chord = 'N'  # No chord
                best_score = 0
                
                for chord_name, template in chord_templates.items():
                    score = np.dot(frame_chroma, template)
                    if score > best_score and score > 0.5:
                        best_score = score
                        best_chord = chord_name
                
                detected_chords.append(best_chord)
            
            return detected_chords
            
        except Exception as e:
            print(f"Chord detection error: {e}")
            return ['N']
    
    async def _detect_tempo(self, audio: np.ndarray, sr: int) -> float:
        """템포 감지"""
        
        try:
            tempo, _ = librosa.beat.beat_track(y=audio, sr=sr)
            return float(tempo)
        except:
            return 120.0  # 기본값
    
    async def _detect_key(self, audio: np.ndarray, notes: List[Dict]) -> str:
        """키 감지 (간소화)"""
        
        if not notes:
            return 'C'
        
        try:
            # 크로마 기반 키 감지
            chroma = librosa.feature.chroma_stft(y=audio, sr=22050)
            chroma_mean = np.mean(chroma, axis=1)
            
            # 간단한 키 템플릿
            key_profiles = {
                'C': [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
                'G': [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
                'F': [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
                'D': [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
                'A': [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
                'E': [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
            }
            
            best_key = 'C'
            best_score = 0
            
            for key, profile in key_profiles.items():
                score = np.corrcoef(chroma_mean, profile)[0, 1]
                if score > best_score:
                    best_score = score
                    best_key = key
            
            return best_key
            
        except:
            return 'C'
    
    async def _detect_techniques(self, audio: np.ndarray, notes: List[Dict]) -> List[str]:
        """기타 테크닉 감지"""
        
        techniques = []
        
        try:
            # 스펙트럴 분석
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=22050)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=22050)
            
            # 간단한 휴리스틱
            if np.mean(spectral_centroids) > 3000:
                techniques.append('bright_picking')
            
            if len(notes) > 20:
                techniques.append('fast_playing')
            
            # RMS 에너지
            rms = librosa.feature.rms(y=audio)[0]
            if np.std(rms) > 0.1:
                techniques.append('dynamic_playing')
            
            return techniques
            
        except:
            return ['standard_picking']
    
    def _calculate_difficulty(self, notes: List[Dict], chords: List[str], techniques: List[str]) -> int:
        """난이도 계산 (1-10)"""
        
        difficulty = 1
        
        # 노트 밀도
        if len(notes) > 30:
            difficulty += 2
        elif len(notes) > 15:
            difficulty += 1
        
        # 코드 복잡도
        complex_chords = [c for c in chords if len(c) > 2]  # 7th, 9th 등
        if len(complex_chords) > 0:
            difficulty += 2
        
        # 테크닉 복잡도
        if len(techniques) > 2:
            difficulty += 2
        
        return min(10, difficulty)
    
    def _calculate_confidence(self, notes: List[Dict], chords: List[str], tempo: float) -> float:
        """분석 신뢰도 계산"""
        
        confidence = 0.5  # 기본값
        
        # 노트 신뢰도
        if notes:
            avg_note_confidence = np.mean([n.get('confidence', 0) for n in notes])
            confidence += avg_note_confidence * 0.3
        
        # 코드 감지 신뢰도
        if len([c for c in chords if c != 'N']) > 0:
            confidence += 0.2
        
        # 템포 신뢰도
        if 60 <= tempo <= 200:  # 합리적 템포 범위
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def _empty_analysis(self, timestamp: float) -> StreamAnalysis:
        """빈 분석 결과"""
        return StreamAnalysis(
            timestamp=timestamp,
            notes=[],
            chords=['N'],
            tempo=120.0,
            key='C',
            confidence=0.0,
            techniques=[],
            difficulty=1
        )
    
    def stop_analysis(self):
        """분석 중단"""
        self.is_analyzing = False
    
    def get_analysis_summary(self) -> Dict:
        """전체 분석 요약"""
        
        if not self.analysis_history:
            return {'status': 'no_analysis'}
        
        all_notes = []
        all_chords = []
        all_techniques = []
        tempo_values = []
        
        for analysis in self.analysis_history:
            all_notes.extend(analysis.notes)
            all_chords.extend(analysis.chords)
            all_techniques.extend(analysis.techniques)
            tempo_values.append(analysis.tempo)
        
        summary = {
            'total_duration': self.total_duration,
            'avg_tempo': np.mean(tempo_values) if tempo_values else 120,
            'most_common_key': self._find_most_common_key(),
            'chord_progression': self._analyze_chord_progression(all_chords),
            'techniques_used': list(set(all_techniques)),
            'difficulty_rating': self._calculate_overall_difficulty(),
            'note_density': len(all_notes) / (self.total_duration / 60) if self.total_duration > 0 else 0,
            'recommended_practice_approach': self._generate_practice_recommendations()
        }
        
        return summary
    
    def _find_most_common_key(self) -> str:
        """가장 빈번한 키 찾기"""
        keys = [analysis.key for analysis in self.analysis_history]
        if not keys:
            return 'C'
        return max(set(keys), key=keys.count)
    
    def _analyze_chord_progression(self, chords: List[str]) -> List[str]:
        """코드 진행 패턴 분석"""
        # 연속된 같은 코드 제거
        progression = []
        for chord in chords:
            if not progression or chord != progression[-1]:
                progression.append(chord)
        
        return progression[:16]  # 최대 16개 코드
    
    def _calculate_overall_difficulty(self) -> int:
        """전체 난이도 계산"""
        if not self.analysis_history:
            return 1
        
        difficulties = [analysis.difficulty for analysis in self.analysis_history]
        return int(np.mean(difficulties))
    
    def _generate_practice_recommendations(self) -> List[str]:
        """연습 추천사항 생성"""
        recommendations = []
        
        if self.analysis_history:
            avg_difficulty = self._calculate_overall_difficulty()
            
            if avg_difficulty <= 3:
                recommendations.extend([
                    "Start with chord changes at slow tempo",
                    "Focus on clean fretting",
                    "Practice with metronome"
                ])
            elif avg_difficulty <= 6:
                recommendations.extend([
                    "Break down complex sections",
                    "Practice scale patterns",
                    "Work on timing precision"
                ])
            else:
                recommendations.extend([
                    "Isolate difficult techniques",
                    "Use progressive speed training",
                    "Record yourself for analysis"
                ])
        
        return recommendations


# 사용 예시 및 테스트
async def test_youtube_streaming():
    """YouTube 스트리밍 분석 테스트"""
    
    analyzer = YouTubeStreamAnalyzer()
    
    # 테스트용 YouTube URL (실제 사용 시 교체)
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    try:
        print("Starting YouTube streaming analysis...")
        
        analysis_results = []
        
        async def progress_callback(data):
            print(f"Progress: {data['progress']:.1f}% - Time: {data['current_time']:.1f}s")
            if data.get('analysis'):
                print(f"  Notes: {len(data['analysis'].notes)}")
                print(f"  Chords: {data['analysis'].chords[:3]}")
                print(f"  Tempo: {data['analysis'].tempo:.1f}")
        
        # 스트리밍 분석 실행
        async for analysis in analyzer.analyze_stream(test_url, progress_callback):
            analysis_results.append(analysis)
            
            # 처음 몇 개 결과만 출력 (테스트용)
            if len(analysis_results) >= 5:
                break
        
        # 분석 요약
        summary = analyzer.get_analysis_summary()
        print("\nAnalysis Summary:")
        print(f"  Duration: {summary.get('total_duration', 0):.1f}s")
        print(f"  Avg Tempo: {summary.get('avg_tempo', 120):.1f} BPM")
        print(f"  Key: {summary.get('most_common_key', 'Unknown')}")
        print(f"  Difficulty: {summary.get('difficulty_rating', 1)}/10")
        print(f"  Techniques: {summary.get('techniques_used', [])}")
        
        return analysis_results
        
    except Exception as e:
        print(f"Test failed: {e}")
        return []


if __name__ == "__main__":
    # 테스트 실행
    asyncio.run(test_youtube_streaming())