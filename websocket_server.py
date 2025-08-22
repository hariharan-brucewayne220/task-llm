#!/usr/bin/env python3
"""
WebSocket Server for Real-time Dashboard
Lightweight Flask-SocketIO server for red team assessment visualization
"""

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
import logging
import threading
import os
import time
from datetime import datetime
from dotenv import load_dotenv
from red_team_engine import RedTeamEngine, USE_BACKEND_CLIENT
from scheduled_assessments import scheduler_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'red-team-websocket-server'

# Enable CORS for React frontend
frontend_port = int(os.getenv('FRONTEND_PORT', 3000))
CORS(app, origins=[f"http://localhost:{frontend_port}"])

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store connected clients and assessment data
connected_clients = set()
current_assessment = None

@app.route('/')
def index():
    """Serve basic status page."""
    return {
        'status': 'WebSocket server running',
        'connected_clients': len(connected_clients),
        'endpoint': '/ws'
    }

@app.route('/api/test-connection', methods=['POST'])
def test_llm_connection():
    """Test LLM API connection with a simple hello message."""
    try:
        data = request.get_json()
        provider = data.get('provider')
        model = data.get('model')
        api_key = data.get('api_key')
        
        if not all([provider, model, api_key]):
            return {
                'success': False,
                'error': 'Missing required parameters: provider, model, or api_key'
            }, 400
        
        logger.info(f"Testing connection to {provider} {model}...")
        
        # Import and test LLM client (similar to quick_sanity_test.py)
        if USE_BACKEND_CLIENT:
            from app.services.llm_client import LLMClientFactory
            client = LLMClientFactory.create_client(provider, api_key, model)
        else:
            # Use simple client for OpenAI
            if provider != 'openai':
                return {
                    'success': False,
                    'error': f'Simple client only supports OpenAI. Provider "{provider}" not supported in standalone mode.'
                }, 400
            
            from red_team_engine import SimpleLLMClient
            client = SimpleLLMClient(api_key, model)
        
        # Send test message (same as quick_sanity_test.py)
        start_time = time.time()
        response = client.generate_response(
            "Hello, this is a connection test. Please respond briefly.",
            temperature=0.7
        )
        test_time = time.time() - start_time
        
        # Check if we got a valid response
        if response and response.get('response'):
            return {
                'success': True,
                'message': 'Connection successful',
                'response_preview': response['response'][:100] + ('...' if len(response['response']) > 100 else ''),
                'response_time': round(test_time, 2),
                'model': model,
                'provider': provider
            }
        else:
            return {
                'success': False,
                'error': 'No response received from API'
            }, 500
            
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return {
            'success': False,
            'error': f'Connection failed: {str(e)}'
        }, 500

@app.route('/api/assessments/historical')
def get_historical_assessments():
    """Get historical assessment data."""
    try:
        from red_team_engine import RedTeamEngine
        historical_data = RedTeamEngine.get_historical_assessments(limit=10)
        
        return {
            'success': True,
            'assessments': historical_data,
            'count': len(historical_data)
        }
    except Exception as e:
        logger.error(f"Failed to get historical data: {e}")
        return {
            'success': False,
            'error': str(e),
            'assessments': []
        }, 500

@app.route('/api/assessments/<assessment_id>/results')
def get_assessment_results(assessment_id):
    """Get test results for a specific assessment."""
    try:
        from red_team_engine import RedTeamEngine
        test_results = RedTeamEngine.get_test_results_for_assessment(assessment_id)
        
        return {
            'success': True,
            'results': test_results,
            'count': len(test_results)
        }
    except Exception as e:
        logger.error(f"Failed to get test results: {e}")
        return {
            'success': False,
            'error': str(e),
            'results': []
        }, 500

@app.route('/api/scheduled-assessments', methods=['GET'])
def get_scheduled_assessments():
    """Get all scheduled assessments."""
    try:
        assessments = scheduler_manager.get_all_scheduled_assessments()
        return {
            'success': True,
            'assessments': assessments,
            'count': len(assessments)
        }
    except Exception as e:
        logger.error(f"Failed to get scheduled assessments: {e}")
        return {
            'success': False,
            'error': str(e),
            'assessments': []
        }, 500

@app.route('/api/scheduled-assessments', methods=['POST'])
def create_scheduled_assessment():
    """Create a new scheduled assessment."""
    try:
        data = request.get_json()
        assessment_id = scheduler_manager.create_scheduled_assessment(data)
        
        return {
            'success': True,
            'assessment_id': assessment_id,
            'message': 'Scheduled assessment created successfully'
        }
    except Exception as e:
        logger.error(f"Failed to create scheduled assessment: {e}")
        return {
            'success': False,
            'error': str(e)
        }, 500

@app.route('/api/scheduled-assessments/<assessment_id>', methods=['DELETE'])
def delete_scheduled_assessment(assessment_id):
    """Delete a scheduled assessment."""
    try:
        success = scheduler_manager.delete_scheduled_assessment(assessment_id)
        
        if success:
            return {
                'success': True,
                'message': 'Scheduled assessment deleted successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Assessment not found'
            }, 404
    except Exception as e:
        logger.error(f"Failed to delete scheduled assessment: {e}")
        return {
            'success': False,
            'error': str(e)
        }, 500

@app.route('/api/scheduled-assessments/<assessment_id>/toggle', methods=['POST'])
def toggle_scheduled_assessment(assessment_id):
    """Toggle active status of a scheduled assessment."""
    try:
        success = scheduler_manager.toggle_assessment_status(assessment_id)
        
        if success:
            return {
                'success': True,
                'message': 'Assessment status toggled successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Assessment not found'
            }, 404
    except Exception as e:
        logger.error(f"Failed to toggle assessment status: {e}")
        return {
            'success': False,
            'error': str(e)
        }, 500

@app.route('/api/scheduled-assessments/<assessment_id>/run', methods=['POST'])
def run_scheduled_assessment_now(assessment_id):
    """Run a scheduled assessment immediately."""
    try:
        success = scheduler_manager.run_scheduled_assessment_now(assessment_id)
        
        if success:
            return {
                'success': True,
                'message': 'Assessment started successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Assessment not found'
            }, 404
    except Exception as e:
        logger.error(f"Failed to run scheduled assessment: {e}")
        return {
            'success': False,
            'error': str(e)
        }, 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    client_id = request.sid if 'request' in globals() else 'unknown'
    connected_clients.add(client_id)
    
    logger.info(f"Client connected: {client_id}")
    emit('connected', {
        'status': 'connected',
        'message': 'Connected to Red Team Assessment Server'
    })
    
    # Send current assessment status if available
    if current_assessment:
        emit('assessment_status', current_assessment)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    client_id = request.sid if 'request' in globals() else 'unknown'
    connected_clients.discard(client_id)
    
    logger.info(f"Client disconnected: {client_id}")

@socketio.on('get_status')
def handle_get_status():
    """Get current server status."""
    emit('status', {
        'connected_clients': len(connected_clients),
        'assessment_active': current_assessment is not None
    })

@socketio.on('start_assessment')
def handle_start_assessment(data):
    """Handle assessment start request."""
    logger.info(f"Starting assessment with config: {data}")
    
    # Start assessment in background thread
    def run_assessment():
        try:
            # Get assessment configuration
            assessment_config = data.get('assessmentConfig', {})
            total_prompts = assessment_config.get('assessmentScope', {}).get('totalPrompts', 10)
            categories = assessment_config.get('testCategories', ['jailbreak', 'bias'])
            
            # Calculate prompts per category (distribute evenly)
            prompts_per_category = max(1, total_prompts // len(categories)) if categories else 5
            
            logger.info(f"Assessment configuration - Total prompts: {total_prompts}, Categories: {categories}, Prompts per category: {prompts_per_category}")
            
            config = {
                'provider': data.get('selectedProvider', 'openai'),
                'model': data.get('selectedModel', 'gpt-3.5-turbo'),
                'api_key': data.get('apiKeys', {}).get(data.get('selectedProvider', 'openai')),
                'categories': categories,
                'max_prompts_per_category': prompts_per_category,
                'websocket_url': 'http://localhost:5000'
            }
            
            engine = RedTeamEngine(config, socketio)
            results = engine.run_assessment()
            
            # Emit final results
            socketio.emit('assessment_completed', {
                'results': results,
                'metrics': engine.calculate_final_metrics(results),
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Assessment failed: {e}")
            socketio.emit('assessment_error', {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    threading.Thread(target=run_assessment, daemon=True).start()
    emit('assessment_started', {'status': 'started'})

@socketio.on('test_message')
def handle_test_message(data):
    """Handle test messages from clients."""
    logger.info(f"Test message received: {data}")
    emit('test_response', {
        'message': 'Server received your message',
        'data': data
    })

# Assessment event handlers (called by red_team_engine.py)
def broadcast_connection_test(data):
    """Broadcast connection test result."""
    socketio.emit('connection_test', data)
    logger.info("Broadcasted connection test result")

def broadcast_assessment_started(data):
    """Broadcast assessment start."""
    global current_assessment
    current_assessment = {
        'status': 'running',
        'start_time': data.get('timestamp'),
        'total_prompts': data.get('total_prompts'),
        'categories': data.get('categories'),
        'current_prompt': 0
    }
    
    socketio.emit('assessment_started', data)
    logger.info("Broadcasted assessment started")

def broadcast_test_started(data):
    """Broadcast individual test start."""
    if current_assessment:
        current_assessment['current_prompt'] = data.get('progress', '0/0').split('/')[0]
        current_assessment['current_test'] = {
            'prompt': data.get('prompt'),
            'category': data.get('category'),
            'progress': data.get('progress')
        }
    
    socketio.emit('test_started', data)
    logger.info(f"Broadcasted test started: {data.get('category')}")

def broadcast_test_completed(data):
    """Broadcast individual test completion."""
    socketio.emit('test_completed', data)
    logger.info(f"Broadcasted test completed: {data.get('category')} - {data.get('risk_level')}")

def broadcast_test_error(data):
    """Broadcast test error."""
    socketio.emit('test_error', data)
    logger.error(f"Broadcasted test error: {data.get('error')}")

def broadcast_assessment_completed(data):
    """Broadcast assessment completion."""
    global current_assessment
    current_assessment = None
    
    socketio.emit('assessment_completed', data)
    logger.info("Broadcasted assessment completed")

# Enhanced WebSocket client for red_team_engine.py
class EnhancedWebSocketClient:
    """Enhanced WebSocket client with better error handling."""
    
    def __init__(self, url='http://localhost:5000'):
        self.url = url
        self.connected = False
        
    def send_connection_test(self, data):
        broadcast_connection_test(data)
    
    def send_assessment_started(self, data):
        broadcast_assessment_started(data)
    
    def send_test_started(self, data):
        broadcast_test_started(data)
    
    def send_test_completed(self, data):
        broadcast_test_completed(data)
    
    def send_test_error(self, data):
        broadcast_test_error(data)
    
    def send_assessment_completed(self, data):
        broadcast_assessment_completed(data)

if __name__ == '__main__':
    # Get port from environment variable
    backend_port = int(os.getenv('BACKEND_PORT', 5000))
    frontend_port = int(os.getenv('FRONTEND_PORT', 3000))
    
    print("Starting WebSocket server for Red Team Dashboard")
    print(f"Dashboard URL: http://localhost:{backend_port}")
    print(f"WebSocket endpoint: ws://localhost:{backend_port}")
    print(f"React frontend should connect to: http://localhost:{frontend_port}")
    
    # Start the scheduled assessment manager
    print("Starting scheduled assessment scheduler...")
    scheduler_manager.start_scheduler()
    
    try:
        socketio.run(
            app,
            host='0.0.0.0',
            port=backend_port,
            debug=True,
            allow_unsafe_werkzeug=True
        )
    except KeyboardInterrupt:
        print("\nShutting down...")
        scheduler_manager.stop_scheduler()
        print("Scheduler stopped")