# 🎸 Genesis Music Platform

<div align="center">
  <img src="genesis-main.png" alt="Genesis Music" width="600"/>
  
  **AI 기반 전문 기타 학습 플랫폼**
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![SvelteKit](https://img.shields.io/badge/SvelteKit-1.20-orange)](https://kit.svelte.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
  [![Python](https://img.shields.io/badge/Python-3.9+-yellow)](https://www.python.org/)
  [![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)
</div>

## 🎯 Overview

Genesis Music은 YouTube 영상이나 오디오 파일을 전문가 수준의 악보와 기타 Tab으로 자동 변환하는 AI 기반 플랫폼입니다. 70-80년대 전설적인 기타리스트들의 스타일을 분석하여 개인 맞춤형 학습을 제공합니다.

### ✨ 주요 기능

- 🎬 **YouTube to Tab/Score**: YouTube URL 입력만으로 자동 악보 생성
- 🎼 **Professional Notation**: VexFlow/AlphaTab을 통한 PDF 품질 악보 렌더링  
- 🎸 **Style Analysis**: Hendrix, Page, Clapton 등 전설적 기타리스트 스타일 분석
- 🎵 **MIDI Support**: MIDI 파일 import/export 및 실시간 편집
- 📊 **Practice Tracking**: 개인 연습 기록 및 진도 관리
- 🎹 **Real-time Playback**: Tone.js 기반 실시간 재생 및 속도 조절

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- Redis 7.0+
- FFmpeg (YouTube 다운로드용)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/genesis-music.git
cd genesis-music

# Install dependencies
npm install

# Setup frontend
cd frontend
npm install

# Setup backend
cd ../backend
npm install

# Setup AI service
cd ../ai-models
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Setup

각 서비스 디렉토리에 `.env` 파일 생성:

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_SERVICE_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/genesis_music
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

**AI Service** (`ai-models/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/genesis_music
REDIS_URL=redis://localhost:6379
```

### Running Development Servers

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: AI Service
cd ai-models
python src/main.py
```

Frontend: http://localhost:5173
Backend API: http://localhost:3001
AI Service: http://localhost:8000

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Frontend      │────▶│   Backend API   │────▶│   AI Service    │
│   (SvelteKit)   │     │   (Node.js)     │     │   (FastAPI)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐             │
         └─────────────▶│   PostgreSQL    │◀────────────┘
                        │   + Redis       │
                        │                 │
                        └─────────────────┘
```

### Tech Stack

**Frontend:**
- SvelteKit + TypeScript
- VexFlow (악보 렌더링)
- AlphaTab (기타 Tab)
- Tone.js (오디오 재생)
- WaveSurfer.js (웨이브폼)
- TailwindCSS

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (데이터베이스)
- Redis (캐싱/세션)
- Socket.io (실시간 통신)
- JWT (인증)

**AI Service:**
- Python + FastAPI
- Basic Pitch (음높이 감지)
- music21 (음악 이론)
- YouTube-DL (다운로드)
- Celery + Redis (작업 큐)

## 📁 Project Structure

```
genesis-music/
├── frontend/               # SvelteKit 프론트엔드
│   ├── src/
│   │   ├── lib/           # 컴포넌트, 서비스, 유틸리티
│   │   └── routes/        # 페이지 라우트
│   └── package.json
├── backend/               # Node.js 백엔드
│   ├── src/
│   │   ├── routes/        # API 엔드포인트
│   │   ├── services/      # 비즈니스 로직
│   │   └── middleware/    # Express 미들웨어
│   └── package.json
├── ai-models/            # Python AI 서비스
│   ├── src/
│   │   ├── models/       # AI 모델
│   │   ├── services/     # 처리 서비스
│   │   └── api/          # FastAPI 라우트
│   └── requirements.txt
└── docs/                 # 프로젝트 문서
```

## 🔧 Development

### Available Scripts

```bash
# Frontend
npm run dev         # 개발 서버
npm run build       # 프로덕션 빌드
npm run preview     # 빌드 미리보기
npm run test        # 테스트 실행
npm run lint        # 린트 검사

# Backend
npm run dev         # 개발 서버 (nodemon)
npm run build       # TypeScript 빌드
npm start           # 프로덕션 서버
npm test            # 테스트 실행

# AI Service
python src/main.py  # 개발 서버
pytest              # 테스트 실행
```

### Testing

```bash
# E2E Tests (Playwright)
npm run test:e2e

# Unit Tests
npm run test:unit

# Python Tests
cd ai-models
pytest
```

## 📚 Documentation

- [Development Status](DEVELOPMENT_STATUS.md) - 현재 개발 상태 및 로드맵
- [Professional Upgrade Plan](GENESIS_MUSIC_PROFESSIONAL_UPGRADE_PLAN.md) - 전체 업그레이드 계획
- [API Documentation](docs/api/api-specification.yaml) - API 명세
- [Architecture Guide](docs/architecture/system-design.md) - 시스템 설계

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

## 📊 Project Status

### Completed ✅
- Professional UI/UX design system
- VexFlow/AlphaTab notation rendering
- MIDI support with editor
- YouTube URL validation
- WebSocket real-time updates
- JWT authentication system

### In Progress 🚧
- YouTube audio extraction
- AI transcription engine
- Style analysis implementation
- Practice tracking system

### Planned 📋
- Social features
- Mobile app
- Advanced AI feedback
- Multi-language support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development**: AI-powered by Claude
- **Design**: Professional music education focus
- **Architecture**: Microservices with scalability

## 📞 Contact

- Issues: [GitHub Issues](https://github.com/yourusername/genesis-music/issues)
- Email: your.email@example.com

---

<div align="center">
  <strong>Built with ❤️ for musicians worldwide</strong>
  
  🤖 Generated with [Claude Code](https://claude.ai/code)
</div>