# Genesis Music - Quick Start Guide
## 🎯 지금 바로 실행하고 확인할 수 있는 것들

---

## 1️⃣ **현재 실행 가능한 기능**

### ✅ **AI 음악 전사 서비스 (Backend)**
YouTube URL이나 오디오 파일을 Tab/악보로 변환

### ✅ **음악 교육 AI 시스템**
전문가급 음악 이론 분석 및 교육

### ✅ **기타 학습 엔진**
운지법 생성, 연습 추천, 스타일 분석

---

## 2️⃣ **즉시 실행 방법**

### **Step 1: AI 서비스 시작**

```bash
# 1. 터미널 열기
cd F:\Genesis_Music

# 2. Python 가상환경 활성화
.\venv\Scripts\activate

# 3. AI 서비스 디렉토리로 이동
cd ai-models\src

# 4. FastAPI 서버 실행
python main.py
```

서버가 시작되면:
- API 문서: http://localhost:8000/docs
- 실시간 테스트 가능!

### **Step 2: API 테스트 (새 터미널에서)**

#### **YouTube → Tab 변환 테스트**
```bash
# PowerShell 또는 새 터미널
curl -X POST http://localhost:8000/youtube/download `
  -H "Content-Type: application/json" `
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "output_format": "mp3"
  }'
```

#### **음악 전사 시작**
```bash
curl -X POST http://localhost:8000/transcribe/start `
  -H "Content-Type: application/json" `
  -d '{
    "file_path": "path/to/audio.mp3",
    "output_format": "midi"
  }'
```

---

## 3️⃣ **브라우저에서 확인**

### **Swagger UI로 API 테스트**
1. 브라우저 열기
2. http://localhost:8000/docs 접속
3. 각 API 엔드포인트 클릭
4. "Try it out" 버튼
5. 파라미터 입력 후 "Execute"

### **실시간 진행률 확인 (WebSocket)**
```javascript
// 브라우저 콘솔에서 실행
const ws = new WebSocket('ws://localhost:8000/ws/transcribe/test-id');
ws.onmessage = (event) => {
    console.log('Progress:', JSON.parse(event.data));
};
```

---

## 4️⃣ **Python 콘솔에서 직접 테스트**

```bash
# Python 인터랙티브 모드
python

>>> from services.music_professor import MusicProfessorAI
>>> professor = MusicProfessorAI()

# 학생 실력 분석
>>> performance = {
...     "technique_score": 0.6,
...     "theory_score": 0.4,
...     "rhythm_score": 0.7,
...     "musicality_score": 0.5
... }

>>> level, weaknesses = professor.analyze_student_level(performance)
>>> print(f"Level: {level.name}, Weaknesses: {weaknesses}")

# 레슨 계획 생성
>>> lessons = professor.generate_lesson_plan(level, weaknesses, professor.select_professor("rock", "shred"))
>>> for lesson in lessons:
...     print(lesson.title)
```

---

## 5️⃣ **버클리 이론 엔진 테스트**

```python
>>> from services.berklee_theory_engine import CompleteMusicTheoryEngine
>>> engine = CompleteMusicTheoryEngine()

# 코드 진행 분석
>>> progression = [
...     ['C', 'E', 'G', 'B'],    # Cmaj7
...     ['A', 'C', 'E', 'G'],    # Am7
...     ['D', 'F#', 'A', 'C'],   # Dm7
...     ['G', 'B', 'D', 'F']     # G7
... ]

>>> analysis = engine.harmony.analyze_progression(progression, key='C')
>>> print(f"Cadences: {analysis['cadences']}")
>>> print(f"Style: {analysis['style_classification']}")

# 재즈 리하모니제이션
>>> original = ['Cmaj7', 'Am7', 'Dm7', 'G7']
>>> reharmonized = engine.jazz.reharmonize(original, technique='tritone')
>>> print(f"Original: {original}")
>>> print(f"Reharmonized: {reharmonized}")
```

---

## 6️⃣ **기타 학습 엔진 테스트**

```python
>>> from services.guitar_learning_engine import GuitarLearningEngine
>>> guitar = GuitarLearningEngine()

# 운지법 생성
>>> notes = ['E', 'G', 'A', 'C', 'D']
>>> fingerings = guitar.generate_fingering(notes)
>>> for note, f in zip(notes, fingerings):
...     print(f"{note}: String {f.string}, Fret {f.fret}, Finger {f.finger}")

# 맞춤 연습 생성
>>> from services.guitar_learning_engine import GuitarTechnique
>>> exercise = guitar.create_custom_exercise(
...     technique=GuitarTechnique.ALTERNATE_PICKING,
...     difficulty=5,
...     focus_area="speed"
... )
>>> print(f"Exercise: {exercise.name}")
>>> print(f"Tab: {exercise.tab_notation}")
>>> print(f"Tips: {exercise.tips}")
```

---

## 7️⃣ **다음 단계 (Next Phase)**

### **Phase 1: Frontend 연결 (1-2일)**
```bash
# Frontend 개발 서버 실행
cd frontend
npm install
npm run dev
```
- TabViewer 컴포넌트 라우팅 연결
- API 통신 설정
- 실시간 WebSocket 연동

### **Phase 2: 통합 테스트 (2-3일)**
- YouTube URL 입력 → Tab 출력 전체 플로우
- 실시간 재생 및 따라하기
- 학습 진도 추적

### **Phase 3: 프로덕션 준비 (1주)**
- Docker 컨테이너화
- 클라우드 배포 (AWS/GCP)
- 도메인 설정 및 SSL

---

## 🎯 **지금 당장 확인할 수 있는 것**

1. **http://localhost:8000/docs** - API 문서 및 테스트
2. **YouTube 다운로드** - 실제 YouTube 영상 다운로드
3. **음악 전사** - MP3 → MIDI 변환
4. **이론 분석** - 코드 진행 분석
5. **교육 시스템** - 레슨 생성 및 평가

---

## 🚨 **트러블슈팅**

### FFmpeg 설치 필요
```bash
# Windows (관리자 권한)
choco install ffmpeg

# 또는 수동 설치
# https://ffmpeg.org/download.html
```

### Python 패키지 누락
```bash
cd ai-models
pip install -r requirements.txt
```

### 포트 충돌
```bash
# 8000 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

---

## 📞 **도움이 필요하면**

1. 에러 메시지 전체를 복사
2. `ai-models/logs/` 폴더 확인
3. http://localhost:8000/docs 에서 API 응답 확인

**지금 바로 실행해보세요! AI 서비스는 완전히 작동합니다. 🚀**