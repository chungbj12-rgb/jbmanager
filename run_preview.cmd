@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1 && py -3 preview_server.py %* && exit /b 0
where python >nul 2>&1 && python preview_server.py %* && exit /b 0
where python3 >nul 2>&1 && python3 preview_server.py %* && exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview_server.ps1" %*
exit /b %ERRORLEVEL%
