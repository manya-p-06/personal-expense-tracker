
@echo off
cd /d "%~dp0"

echo Running automated tests...

".venv\Scripts\python.exe" -m pytest tests -v

pause
