@echo off
cd /d "%~dp0"
echo Starting ScopeShield at http://127.0.0.1:3210
echo Keep this window open while using the app.
node server.mjs
pause
