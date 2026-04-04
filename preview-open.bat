@echo off
chcp 65001 >nul
cd /d "%~dp0"
python preview_server.py --open 2>nul
if errorlevel 1 py -3 preview_server.py --open 2>nul
if errorlevel 1 (
  echo Python이 필요합니다. https://www.python.org/downloads/
  pause
)
