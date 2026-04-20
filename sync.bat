@echo off
REM One-click sync for mjrifat.com — double-click this file from Explorer,
REM or run "sync" from the portfolio folder in any terminal.

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync.ps1"
