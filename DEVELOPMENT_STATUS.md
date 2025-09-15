# Genesis Music Platform - Development Status & Roadmap

## 🎯 프로젝트 개요
Genesis Music은 AI 기반 전문 기타 학습 플랫폼으로, YouTube 영상이나 오디오 파일을 악보와 Tab으로 자동 변환하고, 70-80년대 전설적인 기타리스트들의 스타일을 분석하여 학습을 지원합니다.

## 📅 현재 개발 상태 (2024-09-15)

### ✅ 완료된 기능

#### 1. **Frontend (SvelteKit + TypeScript)**
- ✅ 프로페셔널 디자인 시스템 구축
  - 다크/라이트 테마 지원
  - 반응형 그리드 시스템
  - 재사용 가능한 UI 컴포넌트 (Button, Card, Grid, Container, Section)
  
- ✅ 악보 렌더링 시스템
  - VexFlow 통합 (표준 오선 악보)
  - AlphaTab 통합 (기타 Tab)
  - 확대/축소, 페이지네이션
  - PDF 품질 렌더링

- ✅ 오디오 플레이어
  - WaveSurfer.js 웨이브폼 시각화
  - 속도 조절 (25% - 150%)
  - 루프 구간 설정
  - 볼륨 컨트롤

- ✅ MIDI 시스템
  - Tone.js 통합
  - MIDI 파일 import/export
  - Piano Roll 에디터
  - 멀티트랙 지원
  - 실시간 재생/편집

- ✅ YouTube 통합
  - URL 검증 및 비디오 정보 가져오기
  - 전사 옵션 설정 (악기, 난이도, 스타일)
  - 실시간 진행률 표시
  - 작업 대기열 관리

- ✅ 파일 업로드 시스템
  - 드래그 앤 드롭 지원
  - 오디오 파일 (MP3, WAV, OGG, M4A, FLAC)
  - MIDI 파일 지원
  - MusicXML, Guitar Pro 파일 지원

#### 2. **Backend (Node.js + Express + TypeScript)**
- ✅ API 서버 구조
  - RESTful API 설계
  - JWT 인증 시스템
  - WebSocket (Socket.io) 실시간 통신
  
- ✅ 데이터베이스 (PostgreSQL)
  - Users 테이블 (인증, 프로필, 구독)
  - Scores 테이블 (악보 데이터)
  - Practice Sessions 테이블 (학습 추적)
  - Transcription Jobs 테이블 (전사 작업)

- ✅ 서비스 레이어
  - Redis 캐싱
  - Rate Limiting
  - Error Handling
  - Winston 로깅

#### 3. **AI Service (Python + FastAPI)**
- ✅ 기본 구조 설정
  - FastAPI 서버
  - Basic Pitch 통합 준비
  - YouTube 다운로드 모듈
  - Celery + Redis 작업 대기열

### 📁 프로젝트 구조
```
Genesis_Music/
├── frontend/               # SvelteKit 프론트엔드
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/   # UI 컴포넌트
│   │   │   ├── services/     # API 서비스
│   │   │   ├── stores/       # Svelte 스토어
│   │   │   ├── utils/        # 유틸리티
│   │   │   └── design/       # 디자인 시스템
│   │   └── routes/           # 페이지 라우트
│   └── package.json
│
├── backend/                # Node.js 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   ├── services/        # 비즈니스 로직
│   │   ├── middleware/      # 미들웨어
│   │   └── utils/           # 유틸리티
│   └── package.json
│
├── ai-models/              # Python AI 서비스
│   ├── src/
│   │   ├── models/         # AI 모델
│   │   ├── services/       # 서비스 로직
│   │   └── api/            # FastAPI 엔드포인트
│   └── requirements.txt
│
└── CLAUDE.md              # 프로젝트 가이드라인
```

## 🚀 다음 개발 단계 (Next Phase)

### Phase 1: Backend API 완성 (1주)
1. **Authentication Routes** (`/routes/auth.ts`)
   - [ ] 회원가입 엔드포인트
   - [ ] 로그인 엔드포인트
   - [ ] 토큰 갱신
   - [ ] 비밀번호 재설정

2. **Score Management Routes** (`/routes/scores.ts`)
   - [ ] CRUD operations
   - [ ] 검색 및 필터링
   - [ ] 공유 기능

3. **YouTube Routes** (`/routes/youtube.ts`)
   - [ ] 비디오 정보 가져오기
   - [ ] 오디오 다운로드
   - [ ] 전사 작업 시작

4. **Practice Routes** (`/routes/practice.ts`)
   - [ ] 세션 시작/종료
   - [ ] 진행 상황 저장
   - [ ] 통계 생성

### Phase 2: AI Service 구현 (2주)
1. **Audio Processing Pipeline**
   - [ ] YouTube 다운로드 구현
   - [ ] 오디오 전처리
   - [ ] Basic Pitch 통합
   - [ ] MIDI 생성

2. **Style Analysis Engine**
   - [ ] 스타일 특징 추출
   - [ ] 기타리스트별 패턴 분석
   - [ ] 유사도 계산

3. **Tab Generation**
   - [ ] MIDI to Tab 변환
   - [ ] 핑거링 최적화
   - [ ] 난이도 조정

### Phase 3: Frontend-Backend 통합 (1주)
1. **API Integration**
   - [ ] 실제 API 연결
   - [ ] WebSocket 연동
   - [ ] 에러 처리

2. **User Authentication**
   - [ ] 로그인/회원가입 페이지
   - [ ] 프로필 관리
   - [ ] 권한 관리

3. **Real-time Updates**
   - [ ] 전사 진행률 실시간 표시
   - [ ] 알림 시스템
   - [ ] 동시 사용자 지원

### Phase 4: 고급 기능 (2주)
1. **Practice Tracking**
   - [ ] 연습 기록 저장
   - [ ] 진행 상황 시각화
   - [ ] 목표 설정

2. **Social Features**
   - [ ] 악보 공유
   - [ ] 댓글 시스템
   - [ ] 사용자 팔로우

3. **Advanced Analysis**
   - [ ] 상세 스타일 분석
   - [ ] 연주 비교
   - [ ] AI 피드백

## 🛠️ 개발 환경 설정

### 필수 설치 항목
```bash
# Node.js (v18+)
# Python (3.9+)
# PostgreSQL
# Redis
# FFmpeg (YouTube 다운로드용)
```

### 환경 변수 설정
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3001/api
VITE_AI_SERVICE_URL=http://localhost:8000

# Backend (.env)
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/genesis_music
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# AI Service (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/genesis_music
REDIS_URL=redis://localhost:6379
YOUTUBE_DL_PATH=/usr/local/bin/youtube-dl
```

### 개발 서버 실행
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# AI Service
cd ai-models
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

## 🎯 품질 목표

### 성능 지표
- 페이지 로드 시간: < 3초
- API 응답 시간: < 200ms
- 전사 정확도: > 90%
- 동시 사용자: 1000+

### 코드 품질
- TypeScript/Python 타입 힌트 100%
- 테스트 커버리지 > 80%
- ESLint/Prettier 규칙 준수
- 문서화 완료

## 📝 주요 기술 스택

### Frontend
- SvelteKit 1.20+
- TypeScript 5.0+
- VexFlow 4.2.3
- AlphaTab 1.6.3
- Tone.js 14.7
- WaveSurfer.js 7.0
- TailwindCSS 3.3

### Backend  
- Node.js 18+
- Express 4.18
- TypeScript 5.0+
- PostgreSQL 15
- Redis 7.0
- Socket.io 4.5

### AI Service
- Python 3.9+
- FastAPI 0.100+
- Basic Pitch
- music21
- Celery
- YouTube-DL

## 🔄 Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 코드
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 업무 수정
```

## 📞 연락처 및 리소스

- 프로젝트 문서: `/GENESIS_MUSIC_PROFESSIONAL_UPGRADE_PLAN.md`
- API 문서: `/docs/api.md` (작성 예정)
- 디자인 가이드: `/frontend/src/lib/design/`

## 🚨 알려진 이슈

1. AlphaTab 패키지명 변경 필요 (`@coderline/alphatab`)
2. TypeScript 설정 경로 수정 필요
3. PostgreSQL, Redis 로컬 설치 필요
4. FFmpeg 설치 필요 (YouTube 다운로드)

## 📌 중요 참고사항

- 모든 코드는 TypeScript/Python 타입 힌트 사용
- 비동기 작업은 async/await 패턴 사용
- 에러 처리는 중앙화된 핸들러 사용
- 로깅은 Winston(Node.js), logging(Python) 사용
- 모든 API는 JWT 인증 필요
- WebSocket으로 실시간 업데이트

---

**마지막 업데이트**: 2024-09-15
**다음 리뷰**: Phase 1 완료 후