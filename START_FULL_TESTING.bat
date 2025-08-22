@echo off
echo 🛡️  LLM Red Team Security Platform - FULL TESTING
echo ================================================
echo.
echo 🎯 Starting Complete System for End-to-End Testing
echo.
echo Components:
echo ✅ WebSocket Server (Real-time updates)  
echo ✅ Red Team Engine (Assessment execution)
echo ✅ Next.js Dashboard (Professional UI)
echo.
echo 🔑 Make sure to set your API keys first:
echo    set OPENAI_API_KEY=sk-your-key-here
echo    set ANTHROPIC_API_KEY=sk-ant-your-key  
echo    set GOOGLE_API_KEY=your-google-key
echo.
echo 📱 URLs will be:
echo    Dashboard:    http://localhost:3000
echo    WebSocket:    http://localhost:5000
echo.
echo Starting in 5 seconds...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Starting WebSocket Server...
start cmd /k "cd /d %~dp0 && red_team_env\Scripts\activate && python websocket_server.py"

timeout /t 3 /nobreak >nul

echo 🚀 Starting Dashboard...
start cmd /k "cd /d %~dp0\dashboard && npm run dev"

echo.
echo ✅ System Starting!
echo.
echo 🎬 Open your browser to: http://localhost:3000
echo 📹 Perfect for video recording and demo!
echo.
echo Press any key to continue...
pause >nul