@echo off
REM Genesis Music 프로젝트 초기화 스크립트 (Windows)

echo 🎸 Genesis Music 프로젝트 초기화 시작...

REM Git 초기화
if not exist ".git" (
    git init
    echo ✓ Git 저장소 초기화 완료
)

REM 프로젝트 구조 생성
echo 프로젝트 구조 생성 중...

REM Frontend 구조
mkdir frontend\src\lib\audio 2>nul
mkdir frontend\src\lib\notation 2>nul
mkdir frontend\src\lib\analysis 2>nul
mkdir frontend\src\lib\api 2>nul
mkdir frontend\src\routes\player 2>nul
mkdir frontend\src\routes\analysis 2>nul
mkdir frontend\static 2>nul

REM Backend 구조
mkdir backend\src\api\transcription 2>nul
mkdir backend\src\api\analysis 2>nul
mkdir backend\src\api\storage 2>nul
mkdir backend\src\services 2>nul
mkdir backend\src\models 2>nul
mkdir backend\src\utils 2>nul

REM AI Models 구조
mkdir ai-models\src\api 2>nul
mkdir ai-models\src\services 2>nul
mkdir ai-models\src\models 2>nul
mkdir ai-models\src\utils 2>nul
mkdir ai-models\tests 2>nul
mkdir ai-models\notebooks 2>nul

REM 모델 저장 디렉토리
mkdir models\pretrained 2>nul
mkdir models\custom 2>nul
mkdir models\weights 2>nul

echo ✓ 프로젝트 구조 생성 완료

REM 초기 Frontend 파일 생성
echo Frontend 초기 파일 생성 중...

REM app.html
echo ^<!DOCTYPE html^> > frontend\src\app.html
echo ^<html lang="ko" %%sveltekit.html.attributes%%^> >> frontend\src\app.html
echo ^<head^> >> frontend\src\app.html
echo   ^<meta charset="utf-8" /^> >> frontend\src\app.html
echo   ^<link rel="icon" href="%%sveltekit.assets%%/favicon.png" /^> >> frontend\src\app.html
echo   ^<meta name="viewport" content="width=device-width, initial-scale=1" /^> >> frontend\src\app.html
echo   %%sveltekit.head%% >> frontend\src\app.html
echo ^</head^> >> frontend\src\app.html
echo ^<body data-sveltekit-preload-data="hover"^> >> frontend\src\app.html
echo   ^<div style="display: contents"^>%%sveltekit.body%%^</div^> >> frontend\src\app.html
echo ^</body^> >> frontend\src\app.html
echo ^</html^> >> frontend\src\app.html

REM Vite 설정
(
echo import { sveltekit } from '@sveltejs/kit/vite';
echo import { defineConfig } from 'vite';
echo.
echo export default defineConfig({
echo   plugins: [sveltekit()],
echo   server: {
echo     port: 5173,
echo     host: true
echo   }
echo });
) > frontend\vite.config.ts

echo ✓ Frontend 초기 파일 생성 완료

REM Python 가상환경 설정
echo Python 환경 설정 중...
cd ai-models
python -m venv venv
echo ✓ Python 가상환경 생성 완료

cd ..

echo.
echo ✨ Genesis Music 프로젝트 초기화 완료!
echo.
echo 다음 단계:
echo.
echo 1. 의존성 설치:
echo    npm install
echo    cd frontend ^&^& npm install
echo    cd ..\backend ^&^& npm install
echo    cd ..\ai-models ^&^& venv\Scripts\activate ^&^& pip install -r ..\backend\requirements.txt
echo.
echo 2. 환경 변수 설정:
echo    copy .env.example .env
echo    REM .env 파일을 편집하세요
echo.
echo 3. Docker 컨테이너 실행:
echo    docker-compose up -d
echo.
echo 4. 개발 서버 시작:
echo    npm run dev
echo.
echo Happy coding! 🎸
pause
