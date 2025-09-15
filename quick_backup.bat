@echo off
echo 🎸 Genesis Music - Quick Backup
echo ================================
echo.

REM Get current timestamp
for /f "tokens=2-4 delims=/ " %%a in ("%date%") do set "datestamp=%%c%%a%%b"
for /f "tokens=1-2 delims=: " %%a in ("%time:~0,5%") do set "timestamp=%%a%%b"

set BACKUP_NAME=%datestamp%_%timestamp%_tab_rendering_complete
set BACKUP_PATH=F:\Genesis_Music\backups\%BACKUP_NAME%

echo Creating backup: %BACKUP_NAME%
echo.

REM Create backup directory
mkdir "%BACKUP_PATH%" 2>nul

REM Copy important directories (exclude node_modules, venv, etc.)
echo Copying source files...
xcopy /E /I /Y "F:\Genesis_Music\ai-models" "%BACKUP_PATH%\ai-models" /EXCLUDE:backup_exclude.txt
xcopy /E /I /Y "F:\Genesis_Music\docs" "%BACKUP_PATH%\docs"
xcopy /E /I /Y "F:\Genesis_Music\config" "%BACKUP_PATH%\config"
xcopy /E /I /Y "F:\Genesis_Music\frontend\src" "%BACKUP_PATH%\frontend\src"
xcopy /E /I /Y "F:\Genesis_Music\backend\src" "%BACKUP_PATH%\backend\src"

REM Copy important files
echo Copying configuration files...
copy "F:\Genesis_Music\*.md" "%BACKUP_PATH%\" >nul
copy "F:\Genesis_Music\*.json" "%BACKUP_PATH%\" >nul
copy "F:\Genesis_Music\*.yml" "%BACKUP_PATH%\" >nul
copy "F:\Genesis_Music\*.py" "%BACKUP_PATH%\" >nul
copy "F:\Genesis_Music\*.txt" "%BACKUP_PATH%\" >nul
copy "F:\Genesis_Music\*.bat" "%BACKUP_PATH%\" >nul

REM Create backup info
echo %date% %time% > "%BACKUP_PATH%\backup_info.txt"
echo Tab Rendering System Complete >> "%BACKUP_PATH%\backup_info.txt"
echo - Advanced MIDI to Tab converter implemented >> "%BACKUP_PATH%\backup_info.txt"
echo - VexFlow tab renderer service integrated >> "%BACKUP_PATH%\backup_info.txt"
echo - VexFlowTabViewer.svelte component created >> "%BACKUP_PATH%\backup_info.txt"
echo - Chord detection and fingering optimization >> "%BACKUP_PATH%\backup_info.txt"
echo - Multiple tuning support >> "%BACKUP_PATH%\backup_info.txt"
echo - Playing technique detection >> "%BACKUP_PATH%\backup_info.txt"

echo.
echo ✅ Backup completed: %BACKUP_PATH%
echo.
pause