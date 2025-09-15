# Genesis Music - AI-Powered Guitar Learning Platform

## 🎸 프로젝트 개요
70-80년대 록/메탈 기타리스트들의 연주 스타일을 AI로 분석하고 학습할 수 있는 고급 웹 애플리케이션

### 핵심 기능
- YouTube/MP3에서 자동 Tab 악보 및 오선보 추출
- 고급 음악 이론 분석 (Modal Interchange, Secondary Dominants 등)
- 유명 기타리스트 스타일 분석 (Yngwie Malmsteen, Randy Rhoads, Metallica, Dream Theater, Eric Clapton)
- 실시간 연주 피드백 및 학습 가이드

### 최신 업데이트 (2025.01.29)
- ✅ YouTube 다운로드 모듈 구현 완료
- ✅ FastAPI 기반 RESTful API 구축
- ✅ WebSocket 실시간 진행률 추적
- ✅ 비동기 처리 파이프라인

## 🛠 기술 스택

### Frontend
- **Framework**: Svelte/SvelteKit (실시간 성능 최적화)
- **Audio Processing**: Web Audio API + AudioWorklets
- **Visualization**: WebGL (악보 렌더링) + VexFlow
- **State Management**: Svelte Stores

### Backend
- **API Server**: Node.js (WebSocket 처리)
- **AI Service**: Python FastAPI (ML 모델 서빙)
- **Database**: PostgreSQL (사용자 데이터) + Redis (캐싱)
- **File Storage**: Google Cloud Storage

### AI/ML
- **Audio Transcription**: Spotify Basic Pitch + GAPS 모델
- **Source Separation**: Demucs v4
- **Music Theory Analysis**: music21 (Python)
- **Style Analysis**: Custom TensorFlow/PyTorch 모델

## 📁 프로젝트 구조
```
Genesis_Music/
├── frontend/          # Svelte 웹 애플리케이션
├── backend/           # Node.js + Python API 서버
├── ai-models/         # AI 모델 및 학습 스크립트
├── docs/              # 프로젝트 문서
├── config/            # 설정 파일
└── docker/            # Docker 컨테이너 설정
```

## 🚀 개발 로드맵

### Phase 1 (1-4주): 핵심 오디오 엔진
- Web Audio API 기반 실시간 오디오 처리
- Basic Pitch 통합 및 기본 전사 기능
- 기타 튜너 및 메트로놈 구현

### Phase 2 (5-8주): AI 전사 및 분석
- GAPS/Basic Pitch 하이브리드 전사 시스템
- music21 기반 음악 이론 분석 엔진
- Tab/오선보 렌더링 시스템

### Phase 3 (9-12주): UI/UX 및 학습 시스템
- Svelte 기반 반응형 UI 구현
- 실시간 협업 기능 (WebSocket)
- 학습 진도 추적 시스템

### Phase 4 (13-16주): 고급 기능 및 최적화
- 기타리스트별 스타일 분석 모듈
- PWA 배포 및 모바일 최적화
- 성능 최적화 및 테스트

## 💻 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Git

### 시작하기

#### 1. 백엔드 설정
```bash
# 프로젝트 디렉토리로 이동
cd F:\Genesis_Music

# Python 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\activate  # Windows

# AI 모델 의존성 설치
cd ai-models
pip install -r requirements.txt

# FFmpeg 설치 (YouTube 다운로드용)
# Windows: https://ffmpeg.org/download.html
# 또는 chocolatey: choco install ffmpeg
```

#### 2. AI 서비스 실행
```bash
# AI 서비스 시작 (포트 8000)
cd ai-models/src
python main.py
```

#### 3. 프론트엔드 설정
```bash
# 새 터미널에서
cd F:\Genesis_Music\frontend
npm install
npm run dev
```

#### 4. API 테스트
```bash
# YouTube 다운로드 테스트
curl -X POST http://localhost:8000/youtube/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
    "output_format": "mp3"
  }'
```

### API 문서
- [YouTube API Documentation](docs/api/youtube_api.md)
- Swagger UI: http://localhost:8000/docs (개발 서버 실행 시)

## 📞 Contact
개인 프로젝트 - AI 기반 기타 학습 플랫폼
