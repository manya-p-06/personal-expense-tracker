
@echo off
title Personal Expense Tracker

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Please run setup.bat first.
    pause
    exit /b 1
)

echo Starting Personal Expense Tracker...

start "" http://127.0.0.1:5000

".venv\Scripts\python.exe" backend\app.py

pause
