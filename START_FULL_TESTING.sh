#!/bin/bash

echo "🛡️  LLM Red Team Security Platform - FULL TESTING"
echo "================================================"
echo ""
echo "🎯 Starting Complete System for End-to-End Testing"
echo ""
echo "Components:"
echo "✅ WebSocket Server (Real-time updates)"  
echo "✅ Red Team Engine (Assessment execution)"
echo "✅ Next.js Dashboard (Professional UI)"
echo ""
echo "🔑 Make sure to set your API keys first:"
echo "   export OPENAI_API_KEY='sk-your-key-here'"
echo "   export ANTHROPIC_API_KEY='sk-ant-your-key'"  
echo "   export GOOGLE_API_KEY='your-google-key'"
echo ""
echo "📱 URLs will be:"
echo "   Dashboard:    http://localhost:3000"
echo "   WebSocket:    http://localhost:5000"
echo ""
echo "Starting in 5 seconds..."
sleep 5

echo ""
echo "🚀 Starting WebSocket Server..."
# Start WebSocket server in background
source red_team_env/Scripts/activate && python websocket_server.py &
WEBSOCKET_PID=$!

sleep 3

echo "🚀 Starting Dashboard..."
# Start dashboard in foreground
cd dashboard && npm run dev

echo ""
echo "🛑 Shutting down WebSocket server..."
kill $WEBSOCKET_PID 2>/dev/null

echo "✅ System stopped!"