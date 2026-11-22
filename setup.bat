
@echo off
title Expense Tracker Setup

echo ==================================
echo PERSONAL EXPENSE TRACKER SETUP
echo ==================================

cd /d "%~dp0"

echo.
echo Creating Python virtual environment...

if not exist ".venv" (
    py -m venv .venv
)

if not exist ".venv\Scripts\python.exe" (
    echo Python installation not found.
    echo Please install Python and try again.
    pause
    exit /b 1
)

echo.
echo Installing required packages...

".venv\Scripts\python.exe" -m pip install --upgrade pip

".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt

if errorlevel 1 (
    echo Package installation failed.
    pause
    exit /b 1
)

echo.
echo ==================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ==================================

pause
