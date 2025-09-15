# Genesis Music - YouTube API Documentation

## Overview
Genesis Music AI Service는 YouTube 비디오에서 오디오를 추출하고 기타 탭으로 변환하는 API를 제공합니다.

## Base URL
```
http://localhost:8000
```

## Authentication
현재 인증 없이 사용 가능 (개발 환경)

## Endpoints

### 1. YouTube Audio Download
YouTube 비디오에서 오디오를 다운로드합니다.

**Endpoint:** `POST /youtube/download`

**Request Body:**
```json
{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "output_format": "mp3",  // mp3, wav, flac
    "audio_quality": "192",  // 128, 192, 256, 320
    "extract_metadata": true
}
```

**Response:**
```json
{
    "success": true,
    "file_path": "/downloads/20240129/Song_Title.mp3",
    "metadata": {
        "video_id": "VIDEO_ID",
        "title": "Song Title",
        "channel": "Artist Name",
        "duration": 240,
        "upload_date": "20231201",
        "thumbnail": "https://...",
        "view_count": 1234567
    },
    "audio_info": {
        "duration": 240.5,
        "sample_rate": 44100,
        "channels": 2,
        "codec": "mp3",
        "bitrate": 192000,
        "file_size": 5760000
    },
    "progress_log": [...]
}
```

### 2. YouTube to Tab Transcription
YouTube 비디오를 다운로드하고 탭으로 변환합니다.

**Endpoint:** `POST /transcribe/youtube`

**Request Body:**
```json
{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "transcription_id": "unique-id-123",
    "output_format": "mp3",
    "options": {
        "source_separation": true,
        "instrument": "guitar",
        "tuning": "standard"
    }
}
```

**Response:**
```json
{
    "transcription_id": "unique-id-123",
    "status": "downloading",
    "message": "YouTube download started"
}
```

### 3. Processing Status
처리 상태를 확인합니다.

**Endpoint:** `GET /status/{transcription_id}`

**Response:**
```json
{
    "transcription_id": "unique-id-123",
    "status": "processing",  // queued, downloading, processing, completed, error
    "progress": 65.5,
    "current_step": "transcription",
    "message": "Transcribing to MIDI...",
    "result": {
        "file_path": "/path/to/audio.mp3",
        "metadata": {...},
        "audio_info": {...}
    },
    "created_at": "2024-01-29T12:00:00",
    "updated_at": "2024-01-29T12:01:30"
}
```

### 4. WebSocket Progress
실시간 진행률 업데이트를 받습니다.

**Endpoint:** `WS /ws/progress/{transcription_id}`

**Connection Example (JavaScript):**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/progress/unique-id-123');

ws.onmessage = (event) => {
    const status = JSON.parse(event.data);
    console.log(`Progress: ${status.progress}% - ${status.message}`);
    
    if (status.status === 'completed' || status.status === 'error') {
        ws.close();
    }
};
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (잘못된 URL, 지원하지 않는 형식 등)
- `404` - Not Found (transcription_id를 찾을 수 없음)
- `500` - Internal Server Error

### Error Response Format
```json
{
    "detail": "Error message describing what went wrong"
}
```

## Processing Steps

1. **Downloading** (0-40%)
   - YouTube 메타데이터 추출
   - 오디오 스트림 다운로드
   - 오디오 포맷 변환

2. **Processing** (40-100%)
   - **Feature Extraction** (40-50%)
   - **Source Separation** (50-60%) - 옵션
   - **MIDI Transcription** (60-70%)
   - **Tab Generation** (70-80%)
   - **Theory Analysis** (80-90%)
   - **Style Detection** (90-100%)

## Rate Limiting
- 동시 처리: 5개 작업
- 분당 요청: 60회

## Usage Examples

### cURL
```bash
# YouTube 다운로드
curl -X POST http://localhost:8000/youtube/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "output_format": "mp3"
  }'

# 전사 시작
curl -X POST http://localhost:8000/transcribe/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "transcription_id": "test-123"
  }'

# 상태 확인
curl http://localhost:8000/status/test-123
```

### Python
```python
import requests
import asyncio
import websockets
import json

# YouTube 다운로드 및 전사
async def transcribe_youtube():
    # 1. 전사 시작
    response = requests.post('http://localhost:8000/transcribe/youtube', json={
        'url': 'https://www.youtube.com/watch?v=VIDEO_ID',
        'transcription_id': 'my-transcription-123'
    })
    
    if response.status_code == 200:
        # 2. WebSocket으로 진행률 모니터링
        async with websockets.connect(
            'ws://localhost:8000/ws/progress/my-transcription-123'
        ) as websocket:
            async for message in websocket:
                status = json.loads(message)
                print(f"Progress: {status['progress']:.1f}% - {status['message']}")
                
                if status['status'] in ['completed', 'error']:
                    break
        
        # 3. 최종 결과 확인
        result = requests.get('http://localhost:8000/status/my-transcription-123')
        return result.json()

# 실행
result = asyncio.run(transcribe_youtube())
```

### JavaScript (Frontend)
```javascript
async function transcribeYouTube(videoUrl) {
    const transcriptionId = `trans-${Date.now()}`;
    
    // 1. Start transcription
    const response = await fetch('http://localhost:8000/transcribe/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: videoUrl,
            transcription_id: transcriptionId
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to start transcription');
    }
    
    // 2. Monitor progress
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:8000/ws/progress/${transcriptionId}`);
        
        ws.onmessage = (event) => {
            const status = JSON.parse(event.data);
            updateProgressBar(status.progress, status.message);
            
            if (status.status === 'completed') {
                ws.close();
                resolve(status);
            } else if (status.status === 'error') {
                ws.close();
                reject(new Error(status.error));
            }
        };
        
        ws.onerror = reject;
    });
}
```

## Notes
- 최대 파일 크기: 500MB
- 지원 비디오 길이: 최대 30분
- 다운로드된 파일은 7일 후 자동 삭제
- YouTube 콘텐츠 정책을 준수해야 함

---

*API Version: 0.2.0*
*Last Updated: 2025-01-29*