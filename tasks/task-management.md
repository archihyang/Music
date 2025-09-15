# Genesis Music MVP - Task Management Guide

## 📊 프로젝트 대시보드

### 현재 상태
- **전체 진행률**: 0% (0/41 tasks)
- **활성 Epic**: 0/5
- **총 스토리 포인트**: 193
- **예상 작업 시간**: 220시간
- **팀 규모**: 4명

### 주요 마일스톤
- ✅ **Week 2**: 개발 환경 준비 완료
- ⏳ **Week 5**: 핵심 AI 서비스 구동
- ⏳ **Week 8**: MVP 기능 완성
- ⏳ **Week 10**: 프로덕션 런칭

## 🚀 즉시 실행 가능한 태스크

### Week 1 - 바로 시작 가능
```bash
# 1. 모노레포 구조 설정 (TASK-001)
npm init -w frontend
npm init -w backend
npm init -w ai-models

# 2. Docker 환경 구성 (TASK-002)
docker-compose up -d

# 3. PostgreSQL 스키마 설계 (TASK-004)
cd backend && npx prisma init
```

### 병렬 작업 트랙
1. **AI 서비스 트랙** (독립 실행 가능)
   - YouTube 다운로더 구현 (TASK-006)
   - Basic Pitch 모델 통합 (TASK-009)

2. **Frontend 트랙** (독립 실행 가능)
   - 라우팅 및 레이아웃 설정 (TASK-015)
   - 상태 관리 구성 (TASK-016)

3. **인프라 트랙** (우선 실행)
   - CI/CD 파이프라인 구성 (TASK-003)
   - Redis 캐싱 설정 (TASK-005)

## 📋 작업 실행 명령어

### 특정 태스크 실행
```bash
# 태스크 상태 확인
/sc:task status TASK-001

# 태스크 실행 (자동 검증 포함)
/sc:task execute TASK-001 --validate

# 병렬 태스크 실행
/sc:task execute TASK-006,TASK-015 --parallel --delegate
```

### Epic 레벨 관리
```bash
# Epic 전체 실행
/sc:task execute EPIC-001 --strategy systematic

# Epic 진행률 확인
/sc:task analytics EPIC-001

# 의존성 체크
/sc:task validate EPIC-002 --check-dependencies
```

### 프로젝트 레벨 명령
```bash
# 전체 프로젝트 상태
/sc:task status GENESIS-MUSIC-MVP --detailed

# 주간 보고서 생성
/sc:task analytics --weekly-report

# 리스크 평가
/sc:task analytics --risk-assessment
```

## 🔄 크로스 세션 지속성

### 세션 복구
```bash
# 이전 세션 상태 로드
/sc:task restore GENESIS-MUSIC-MVP

# 진행 중인 작업 재개
/sc:task continue --last-session
```

### 상태 저장
- 자동 저장: 5분마다
- 수동 저장: `/sc:task save`
- 백업 위치: `tasks/genesis-music-mvp.json`

## 📈 성과 지표 및 검증

### Epic별 완료 기준
1. **EPIC-001 (인프라)**: 
   - ✅ 모든 서비스 Docker로 실행
   - ✅ CI/CD 파이프라인 동작
   - ✅ 데이터베이스 마이그레이션 완료

2. **EPIC-002 (AI 서비스)**:
   - ✅ YouTube → 오디오 변환 성공
   - ✅ 오디오 → MIDI 정확도 80%+
   - ✅ MIDI → Tab 변환 완료

3. **EPIC-003 (Frontend)**:
   - ✅ Tab 렌더링 정상 동작
   - ✅ 오디오 재생 및 동기화
   - ✅ 모바일 반응형 디자인

4. **EPIC-004 (통합)**:
   - ✅ 모든 E2E 테스트 통과
   - ✅ 보안 스캔 통과
   - ✅ 성능 목표 달성

5. **EPIC-005 (배포)**:
   - ✅ 프로덕션 환경 구동
   - ✅ 모니터링 대시보드 활성
   - ✅ 문서화 완료

## 🎯 다음 단계 액션

### 즉시 실행 (Day 1)
```bash
# 1. 태스크 계층 구조 생성 완료 ✅
# 2. 첫 번째 태스크 시작
/sc:task execute TASK-001 --persona devops

# 3. 병렬 트랙 초기화
/sc:spawn parallel --tracks ai,frontend,infrastructure
```

### Week 1 목표
- [ ] TASK-001~005 완료 (인프라 기초)
- [ ] TASK-006 시작 (YouTube 처리)
- [ ] TASK-015 시작 (Frontend 기초)

### 팀 할당 제안
- **DevOps Engineer**: EPIC-001, EPIC-005
- **AI/ML Engineer**: EPIC-002
- **Frontend Developer**: EPIC-003
- **Full Stack**: EPIC-004 (통합 담당)

## 🔧 Wave 모드 실행

### Wave 기반 실행 (고급)
```bash
# Wave 모드로 전체 Epic 실행
/sc:task execute EPIC-002 --wave-mode --wave-count 3

# Wave 1: 분석 및 설계
# Wave 2: 구현 및 테스트
# Wave 3: 최적화 및 검증
```

### MCP 서버 라우팅
- **Context7**: 프레임워크 패턴 (Svelte, FastAPI)
- **Sequential**: 복잡한 태스크 분석
- **Magic**: UI 컴포넌트 생성
- **Playwright**: E2E 테스트 실행

## 📝 노트
- 태스크 파일 위치: `F:\Genesis_Music\tasks\genesis-music-mvp.json`
- 자동 백업 활성화됨
- 실시간 진행률 추적 가능
- 크로스 세션 지속성 활성화