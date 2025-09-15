@echo off
REM Genesis Music 개발 서버 실행 스크립트

echo 🎸 Genesis Music 개발 서버를 시작합니다...
echo.

REM 환경 변수 체크
if not exist ".env" (
    echo ⚠️  .env 파일이 없습니다!
    echo .env.example을 복사하여 .env 파일을 만들어주세요.
    echo.
    pause
    exit /b 1
)

REM Docker 실행 여부 확인
choice /C YN /M "Docker를 사용하여 데이터베이스를 실행하시겠습니까?"
if errorlevel 2 goto NO_DOCKER
if errorlevel 1 goto USE_DOCKER

:USE_DOCKER
echo Docker 컨테이너를 시작합니다...
docker-compose up -d postgres redis
echo.
goto START_SERVERS

:NO_DOCKER
echo 로컬 PostgreSQL과 Redis가 실행 중인지 확인하세요.
echo.

:START_SERVERS
echo 서버를 시작합니다...
echo.

REM 새 터미널 창에서 Frontend 실행
start "Genesis Music - Frontend" cmd /k "cd frontend && npm run dev"

REM 새 터미널 창에서 Backend 실행
start "Genesis Music - Backend" cmd /k "cd backend && npm run dev"

REM 새 터미널 창에서 Python AI Service 실행
start "Genesis Music - AI Service" cmd /k "cd ai-models && venv\Scripts\activate && cd src && python main.py"

echo.
echo ✨ 모든 서비스가 시작되었습니다!
echo.
echo 📍 Frontend: http://localhost:5173
echo 📍 Backend API: http://localhost:3001
echo 📍 AI Service: http://localhost:8000
echo 📍 API Health: http://localhost:3001/health
echo.
echo 종료하려면 각 터미널 창에서 Ctrl+C를 누르세요.
echo.
pause
