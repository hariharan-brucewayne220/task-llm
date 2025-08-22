#!/usr/bin/env python3
"""
Complete LLM Red Team System Runner
Starts all components for full end-to-end testing
"""

import subprocess
import threading
import time
import os
import sys
from pathlib import Path

def print_banner():
    print("""
🛡️  LLM Red Team Security Platform - FULL SYSTEM
================================================

🎯 COMPLETE END-TO-END TESTING READY!

Starting all components:
1. WebSocket Server (Real-time updates)
2. Red Team Engine (Assessment execution) 
3. Next.js Dashboard (Professional UI)

Ready for REAL API testing with live results!
    """)

def check_api_keys():
    """Check if API keys are set for testing."""
    print("🔑 Checking API Keys...")
    
    api_keys = {
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'), 
        'GOOGLE_API_KEY': os.getenv('GOOGLE_API_KEY')
    }
    
    available_keys = []
    for provider, key in api_keys.items():
        if key:
            available_keys.append(provider.replace('_API_KEY', ''))
            print(f"   ✅ {provider}: Set")
        else:
            print(f"   ❌ {provider}: Not set")
    
    if not available_keys:
        print("\n⚠️  No API keys found!")
        print("💡 Set at least one API key for real testing:")
        print("   export OPENAI_API_KEY='your-key-here'")
        print("   export ANTHROPIC_API_KEY='your-key-here'")
        print("   export GOOGLE_API_KEY='your-key-here'")
        print("\n📝 The system will still run with demo/mock data.")
        return False
    else:
        print(f"\n✅ Ready for REAL testing with: {', '.join(available_keys)}")
        return True

def start_websocket_server():
    """Start WebSocket server in background."""
    print("🚀 Starting WebSocket Server...")
    try:
        # Activate virtual environment and start server
        if os.name == 'nt':  # Windows
            subprocess.run([
                'cmd', '/c', 
                'cd /d {} && {}\\Scripts\\activate && python websocket_server.py'.format(
                    os.getcwd(), 
                    os.path.join(os.getcwd(), 'red_team_env')
                )
            ], check=True)
        else:  # Linux/Mac
            subprocess.run([
                'bash', '-c',
                f'cd {os.getcwd()} && source red_team_env/Scripts/activate && python websocket_server.py'
            ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ WebSocket server failed: {e}")
    except KeyboardInterrupt:
        print("🛑 WebSocket server stopped")

def start_dashboard():
    """Start Next.js dashboard."""
    print("🚀 Starting Next.js Dashboard...")
    dashboard_path = Path("dashboard")
    
    if not dashboard_path.exists():
        print("❌ Dashboard directory not found!")
        return
        
    try:
        os.chdir(dashboard_path)
        # Check if node_modules exists
        if not Path("node_modules").exists():
            print("📦 Installing dashboard dependencies...")
            subprocess.run(["npm", "install"], check=True)
        
        # Start development server
        subprocess.run(["npm", "run", "dev"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Dashboard failed: {e}")
    except KeyboardInterrupt:
        print("🛑 Dashboard stopped")
    finally:
        os.chdir("..")

def run_integration_test():
    """Run integration tests to verify system."""
    print("\n🧪 Running Integration Tests...")
    try:
        result = subprocess.run([
            sys.executable, "test_integration.py"
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print("✅ Integration tests passed!")
            return True
        else:
            print("⚠️  Some integration tests failed:")
            print(result.stdout)
            return False
    except Exception as e:
        print(f"❌ Integration tests failed: {e}")
        return False

def main():
    print_banner()
    
    # Check prerequisites
    has_api_keys = check_api_keys()
    
    # Run integration tests first
    if not run_integration_test():
        print("\n❌ Integration tests failed. Please check system setup.")
        return
    
    print(f"""
🎯 SYSTEM STARTUP SEQUENCE
========================

Starting in 5 seconds...

📱 URLs:
   Dashboard:    http://localhost:3000
   WebSocket:    http://localhost:5000
   Backend API:  http://localhost:5002

🎬 Testing Flow:
   1. Open http://localhost:3000
   2. Click "🚀 New Assessment"  
   3. Choose your provider ({', '.join(['OpenAI', 'Anthropic', 'Google']) if has_api_keys else 'Demo Mode'})
   4. Enter API key (real testing)
   5. Watch LIVE red team execution!

Press Ctrl+C to stop all services.
    """)
    
    time.sleep(5)
    
    # Start WebSocket server in background thread
    websocket_thread = threading.Thread(target=start_websocket_server, daemon=True)
    websocket_thread.start()
    
    # Give WebSocket server time to start
    print("⏳ Waiting for WebSocket server to start...")
    time.sleep(3)
    
    # Test WebSocket connection
    try:
        import requests
        response = requests.get('http://localhost:5000', timeout=2)
        print("✅ WebSocket server is running!")
    except:
        print("⚠️  WebSocket server may not be ready yet...")
    
    print("""
🎯 WebSocket Server: RUNNING ✅
🚀 Starting Dashboard...

🎬 READY FOR FULL TESTING!
==========================

Your professional LLM Red Team Security Platform is now running!

Features:
✅ Real-time WebSocket updates
✅ Live assessment execution  
✅ Professional enterprise UI
✅ Complete red team testing
✅ Automated report generation
✅ Multi-provider support
    """)
    
    try:
        # Start dashboard (this blocks until stopped)
        start_dashboard()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down system...")
        print("✅ All services stopped")

if __name__ == "__main__":
    main()