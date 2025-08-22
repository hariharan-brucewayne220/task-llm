#!/usr/bin/env python3
"""
System Startup Script for LLM Red Team Platform
Starts both the WebSocket server and the Next.js dashboard
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def print_banner():
    print("""
🛡️  LLM Red Team Security Platform
=====================================

Starting integrated security assessment system...

Components:
- WebSocket Server (Backend): http://localhost:5000  
- Next.js Dashboard (Frontend): http://localhost:3000
- Red Team Engine: Real-time assessment execution
    """)

def start_websocket_server():
    """Start the WebSocket server."""
    print("🚀 Starting WebSocket server...")
    try:
        subprocess.run([sys.executable, "websocket_server.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ WebSocket server failed to start: {e}")
    except KeyboardInterrupt:
        print("🛑 WebSocket server stopped by user")

def start_dashboard():
    """Start the Next.js dashboard."""
    print("🚀 Starting Next.js dashboard...")
    dashboard_path = Path("dashboard")
    
    if not dashboard_path.exists():
        print("❌ Dashboard directory not found!")
        return
    
    try:
        # Change to dashboard directory and start
        os.chdir(dashboard_path)
        subprocess.run(["npm", "run", "dev"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Dashboard failed to start: {e}")
    except KeyboardInterrupt:
        print("🛑 Dashboard stopped by user")
    finally:
        os.chdir("..")

def check_prerequisites():
    """Check if required dependencies are available."""
    print("🔍 Checking prerequisites...")
    
    # Check Python dependencies
    required_packages = [
        'flask', 'flask-socketio', 'flask-cors', 'requests'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing Python packages: {', '.join(missing_packages)}")
        print("💡 Install with: pip install flask flask-socketio flask-cors requests")
        return False
    
    # Check if npm is available
    try:
        subprocess.run(["npm", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm not found. Please install Node.js")
        return False
    
    # Check if dashboard dependencies are installed
    if not (Path("dashboard") / "node_modules").exists():
        print("📦 Installing dashboard dependencies...")
        try:
            os.chdir("dashboard")
            subprocess.run(["npm", "install"], check=True)
            os.chdir("..")
        except subprocess.CalledProcessError:
            print("❌ Failed to install dashboard dependencies")
            return False
    
    print("✅ Prerequisites check passed")
    return True

def main():
    print_banner()
    
    if not check_prerequisites():
        print("❌ Prerequisites not met. Please fix the issues above.")
        sys.exit(1)
    
    print("🎯 Starting system components...")
    
    # Start WebSocket server in background thread
    websocket_thread = threading.Thread(target=start_websocket_server, daemon=True)
    websocket_thread.start()
    
    # Give WebSocket server time to start
    time.sleep(3)
    
    print("""
✅ System Status:
- WebSocket Server: Running on http://localhost:5000
- Starting Dashboard: http://localhost:3000

📋 Usage Instructions:
1. Wait for dashboard to load at http://localhost:3000
2. Click "New Assessment" to start security testing
3. Configure your LLM provider and API key
4. Select test categories (jailbreak, bias, etc.)
5. Run assessment and monitor real-time results

🔐 API Keys Required:
- OpenAI: Set OPENAI_API_KEY environment variable
- Anthropic: Set ANTHROPIC_API_KEY environment variable  
- Google: Set GOOGLE_API_KEY environment variable

Press Ctrl+C to stop all services.
    """)
    
    try:
        # Start dashboard (this will block until stopped)
        start_dashboard()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down system...")
        print("✅ All services stopped")

if __name__ == "__main__":
    main()