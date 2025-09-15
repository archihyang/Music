# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 프로젝트 개요
Genesis Music - AI 기반 기타 학습 플랫폼
- YouTube/MP3 → Tab/악보 자동 변환
- 70-80년대 기타리스트 스타일 분석
- 실시간 학습 가이드 시스템

## 🛠️ 개발 명령어

### 전체 프로젝트
```bash
# 전체 개발 서버 실행 (Frontend + Backend 동시)
npm run dev

# 전체 빌드
npm run build

# 전체 테스트
npm run test
```

### AI Service (Python/FastAPI)
```bash
# 가상환경 활성화
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# AI 서비스 실행 (포트 8000)
cd ai-models/src
python main.py

# Python 코드 포맷팅
black .

# Python 린팅
pylint src/

# Python 타입 체크
mypy src/

# 테스트 실행 (pytest 설치 필요)
python -m pytest tests/
```

### Frontend (Svelte)
```bash
cd frontend
npm run dev        # 개발 서버 (포트 5173)
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
npm run check      # TypeScript 체크
npm run lint       # ESLint + Prettier 체크
npm run format     # Prettier 포맷팅
npm run test:unit  # 단위 테스트 (Vitest)
npm run test:e2e   # E2E 테스트 (Playwright)
```

### Backend (Node.js)
```bash
cd backend
npm run dev        # 개발 서버 (포트 3001)
npm run build      # TypeScript 빌드
npm start          # 프로덕션 실행
npm run lint       # ESLint 실행
npm run format     # Prettier 포맷팅
npm test           # Jest 테스트
```

### Docker
```bash
# 전체 서비스 실행
docker-compose up -d

# 특정 서비스만 실행
docker-compose up ai-service
docker-compose up backend-node

# 로그 확인
docker-compose logs -f ai-service
```

## 🏗️ 아키텍처 개요

### 3계층 구조
1. **Frontend (Svelte + TypeScript)**
   - Web Audio API 기반 실시간 오디오 처리
   - VexFlow를 통한 악보/탭 렌더링
   - Socket.io-client로 실시간 진행률 추적
   - Tone.js로 오디오 재생 및 시퀀싱

2. **Backend (Node.js + Express)**
   - REST API + WebSocket 서버
   - PostgreSQL 연동 (사용자 데이터)
   - Redis 캐싱 레이어
   - 파일 업로드/스토리지 관리

3. **AI Service (Python + FastAPI)**
   - **핵심 서비스**: 
     - `basic_pitch_service.py`: 음높이 감지 및 MIDI 변환
     - `transcription.py`: 전사 워크플로우 오케스트레이션
     - `youtube_processor.py`: YouTube 다운로드 및 변환
   - **모델 통합**: Basic Pitch, Demucs (예정), music21
   - **비동기 처리**: Celery + Redis (대기열 관리)

### 데이터 플로우
```
YouTube/Audio → AI Service (전사) → Backend (저장) → Frontend (시각화)
                     ↓                    ↑
                WebSocket (진행률) ────────┘
```

### 핵심 모듈
- **Audio Processing Pipeline**: YouTube → 오디오 추출 → 전사 → MIDI/Tab
- **Theory Analysis Engine**: MIDI → music21 → 화성/스케일 분석
- **Real-time Communication**: WebSocket 기반 진행률/상태 업데이트

## 📝 개발 규칙

### 코드 작성 원칙
- **TypeScript/Python**: 타입 힌트 필수 사용
- **비동기 우선**: async/await 패턴 사용
- **에러 처리**: 모든 외부 호출에 try-catch/except
- **로깅**: Winston(Node.js), logging(Python) 사용

### 파일 명명 규칙
- **컴포넌트**: PascalCase (예: `TabViewer.svelte`)
- **서비스/유틸**: camelCase (예: `audioProcessor.ts`)
- **Python 모듈**: snake_case (예: `basic_pitch_service.py`)

### API 엔드포인트 규칙
- REST: `/api/[resource]/[action]`
- WebSocket: `/ws/[feature]/[id]`
- 버전관리: URL에 버전 미포함 (헤더 사용)

## 🔄 현재 작업 중점 사항

### 우선순위 높음
1. **Tab 렌더링 시스템**: VexFlow 통합으로 MIDI → Tab 시각화
2. **오디오 플레이어**: Web Audio API 기반 실시간 재생
3. **UI 컴포넌트**: 진행률 표시, 파일 업로드, 결과 뷰어

### 진행 중
- Frontend 라우팅 및 상태 관리 (Svelte stores)
- WebSocket 연동 테스트
- Docker 환경 최적화

### 주의사항
- **FFmpeg 필수**: YouTube 다운로드 기능 사용 시 시스템에 설치 필요
- **GPU 활용**: AI 모델 실행 시 CUDA 지원 GPU 권장
- **포트 충돌**: 8000(AI), 3001(Backend), 5173(Frontend) 사용 중