# Genesis Music

## 🎸 프로젝트 초기화 완료!

Genesis Music 프로젝트의 기본 구조가 완성되었습니다.

### 📁 프로젝트 구조
```
F:\Genesis_Music\
├── 📄 README.md                 # 프로젝트 개요
├── 📄 docker-compose.yml       # Docker 설정
├── 📁 frontend/                # Svelte 웹앱
├── 📁 backend/                 # Node.js API
├── 📁 ai-models/               # Python AI 서비스
├── 📁 docs/                    # 문서
└── 📁 config/                  # 설정 파일
```

### 🚀 빠른 시작

1. **의존성 설치**
   ```bash
   # Windows
   setup.bat
   ```

2. **환경 변수 설정**
   ```bash
   copy .env.example .env
   # .env 파일 편집
   ```

3. **개발 서버 실행**
   ```bash
   # Windows
   run-dev.bat
   ```

### 🛠️ 현재 구현 상태

#### ✅ 완료된 작업
- 프로젝트 구조 설정
- Frontend 기본 컴포넌트 (Svelte)
- Backend API 구조 (Node.js)
- AI Service 구조 (Python FastAPI)
- Docker 설정
- 개발 환경 스크립트
- YouTube 다운로드 모듈 (yt-dlp)
- FastAPI 엔드포인트 (YouTube, Transcription, Status)
- WebSocket 실시간 통신
- API 문서화

#### 🔄 진행 중인 작업
- [ ] Basic Pitch 통합
- [ ] Web Audio API 연동
- [ ] 데이터베이스 스키마
- [x] WebSocket 실시간 통신 (완료)
- [ ] MIDI → Tab 변환 로직
- [ ] music21 통합

#### 📋 다음 단계
1. **Audio Processing Pipeline**
   - YouTube 다운로드 구현
   - Demucs 소스 분리
   - Basic Pitch 전사

2. **Theory Analysis**
   - music21 통합
   - 코드 진행 분석
   - Modal Interchange 감지

3. **UI/UX Enhancement**
   - VexFlow Tab 렌더링
   - 실시간 재생 컨트롤
   - 학습 진도 시스템

### 📚 주요 기능
- YouTube/MP3 → Tab/악보 자동 변환
- 고급 음악 이론 분석
- 70-80년대 기타리스트 스타일 분석
- 실시간 학습 가이드

### 🔧 기술 스택
- **Frontend**: Svelte, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **AI**: Python, FastAPI, TensorFlow, music21
- **Database**: PostgreSQL, Redis

### 📞 문의
개인 프로젝트 - AI 기반 기타 학습 플랫폼

---

Happy Coding! 🎸✨
