# Genesis Music 프로젝트 구조

## 📁 디렉토리 구조

```
F:\Genesis_Music\
├── 📄 README.md                 # 프로젝트 개요
├── 📄 package.json             # 루트 패키지 설정
├── 📄 docker-compose.yml       # Docker 오케스트레이션
├── 📄 .env.example            # 환경 변수 템플릿
├── 📄 setup.bat              # Windows 설정 스크립트
├── 📄 setup.sh               # Unix 설정 스크립트
│
├── 📁 frontend/              # Svelte 웹 애플리케이션
│   ├── 📄 package.json
│   ├── 📄 svelte.config.js
│   ├── 📄 vite.config.ts
│   ├── 📄 tailwind.config.js
│   ├── 📄 tsconfig.json
│   └── 📁 src/
│       ├── 📄 app.d.ts       # 전역 타입 정의
│       ├── 📄 app.html       # HTML 템플릿
│       ├── 📁 routes/        # 페이지 라우트
│       │   └── 📄 +page.svelte
│       └── 📁 lib/          # 공유 라이브러리
│           └── 📁 components/
│               └── 📄 AudioUploader.svelte
│
├── 📁 backend/               # Node.js API 서버
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 nodemon.json
│   ├── 📄 requirements.txt   # Python 의존성
│   └── 📁 src/
│       ├── 📁 api/
│       ├── 📁 services/
│       └── 📁 models/
│
├── 📁 ai-models/            # Python AI 서비스
│   ├── 📄 pyproject.toml
│   ├── 📁 src/
│   ├── 📁 tests/
│   └── 📁 notebooks/
│
├── 📁 docker/               # Docker 설정
│   └── (Dockerfile들)
│
├── 📁 docs/                 # 프로젝트 문서
│   └── 📄 PROJECT_PLAN.md   # 상세 기획서
│
└── 📁 config/              # 설정 파일들
```

## 🚀 시작하기

### 1. 프로젝트 초기화
```bash
# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh
```

### 2. 의존성 설치
```bash
# 루트 디렉토리에서
npm install

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Python 환경 (Windows)
cd ../ai-models
python -m venv venv
venv\Scripts\activate
pip install -r ../backend/requirements.txt
```

### 3. 환경 변수 설정
```bash
# 루트 디렉토리에서
copy .env.example .env
# .env 파일을 편집하여 필요한 값 입력
```

### 4. 개발 서버 실행
```bash
# 전체 서비스 실행 (Docker 필요)
docker-compose up -d

# 또는 개별 실행
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend Node.js
cd backend
npm run dev

# Terminal 3 - Python AI Service
cd ai-models
venv\Scripts\activate
uvicorn src.main:app --reload --port 8000
```

## 🛠️ 개발 가이드

### Frontend (Svelte/SvelteKit)
- **위치**: `/frontend`
- **포트**: 5173
- **주요 기술**: Svelte, TypeScript, Tailwind CSS, Web Audio API

### Backend (Node.js)
- **위치**: `/backend`
- **포트**: 3001
- **주요 기술**: Express, TypeScript, Socket.io, PostgreSQL

### AI Service (Python)
- **위치**: `/ai-models`
- **포트**: 8000
- **주요 기술**: FastAPI, TensorFlow, music21, Basic Pitch

## 📚 API 엔드포인트

### Transcription API
- `POST /api/transcribe/upload` - 오디오 파일 업로드
- `POST /api/transcribe/youtube` - YouTube URL 처리
- `GET /api/transcribe/:id` - 전사 결과 조회
- `WebSocket /ws` - 실시간 진행 상황

### Analysis API
- `POST /api/analysis/theory` - 음악 이론 분석
- `POST /api/analysis/style` - 스타일 분석
- `GET /api/analysis/:id` - 분석 결과 조회

## 🔧 설정 파일 설명

### `.env` 환경 변수
```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://genesis_user:genesis_pass@localhost:5432/genesis_music

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
```

### `docker-compose.yml`
- PostgreSQL 데이터베이스
- Redis 캐시
- Nginx 리버스 프록시
- 각 서비스 컨테이너

## 📝 Git 브랜치 전략

```
main
├── develop
│   ├── feature/audio-upload
│   ├── feature/transcription
│   ├── feature/theory-analysis
│   └── feature/style-detection
└── release/v1.0.0
```

## 🧪 테스트

```bash
# Frontend 테스트
cd frontend
npm test

# Backend 테스트
cd backend
npm test

# Python 테스트
cd ai-models
pytest
```

## 📦 빌드 및 배포

```bash
# Production 빌드
npm run build

# Docker 이미지 빌드
docker-compose build

# 배포
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 기여 가이드

1. Feature 브랜치 생성
2. 변경사항 커밋
3. 테스트 실행
4. Pull Request 생성

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.
