@echo off
chcp 65001 >nul
cd /d "%~dp0"
python preview_server.py --open 2>nul
if errorlevel 1 py -3 preview_server.py --open 2>nul
if errorlevel 1 (
  echo Python이 설치되어 있어야 합니다. https://www.python.org/downloads/
  pause
)
