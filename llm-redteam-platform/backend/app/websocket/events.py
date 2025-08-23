"""WebSocket event handlers for real-time communication."""
from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from app import socketio
import logging
from datetime import datetime

# Store active connections
active_connections = {}

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    client_id = request.sid
    active_connections[client_id] = {
        'connected_at': datetime.now(),
        'subscribed_assessments': set()
    }
    
    emit('connected', {
        'status': 'connected',
        'client_id': client_id,
        'message': 'Connected to LLM Red Team Platform'
    })
    
    print(f"CLIENT CONNECTED: {client_id}")
    
    logging.info(f"Client {client_id} connected")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    client_id = request.sid
    
    if client_id in active_connections:
        # Leave all assessment rooms
        for assessment_id in active_connections[client_id]['subscribed_assessments']:
            leave_room(f'assessment_{assessment_id}')
        
        del active_connections[client_id]
    
    logging.info(f"Client {client_id} disconnected")

@socketio.on('subscribe_assessment')
def handle_subscribe_assessment(data):
    """Subscribe to real-time updates for an assessment."""
    client_id = request.sid
    assessment_id = data.get('assessment_id')
    
    if not assessment_id:
        emit('error', {'message': 'assessment_id is required'})
        return
    
    # Join the assessment room
    room_name = f'assessment_{assessment_id}'
    join_room(room_name)
    
    # Track subscription
    if client_id in active_connections:
        active_connections[client_id]['subscribed_assessments'].add(assessment_id)
    
    emit('subscribed', {
        'assessment_id': assessment_id,
        'message': f'Subscribed to assessment {assessment_id} updates'
    })
    
    logging.info(f"Client {client_id} subscribed to assessment {assessment_id}")

@socketio.on('unsubscribe_assessment')
def handle_unsubscribe_assessment(data):
    """Unsubscribe from assessment updates."""
    client_id = request.sid
    assessment_id = data.get('assessment_id')
    
    if not assessment_id:
        emit('error', {'message': 'assessment_id is required'})
        return
    
    # Leave the assessment room
    room_name = f'assessment_{assessment_id}'
    leave_room(room_name)
    
    # Remove from tracking
    if client_id in active_connections:
        active_connections[client_id]['subscribed_assessments'].discard(assessment_id)
    
    emit('unsubscribed', {
        'assessment_id': assessment_id,
        'message': f'Unsubscribed from assessment {assessment_id} updates'
    })
    
    logging.info(f"Client {client_id} unsubscribed from assessment {assessment_id}")

@socketio.on('get_assessment_status')
def handle_get_assessment_status(data):
    """Get current status of an assessment."""
    assessment_id = data.get('assessment_id')
    
    if not assessment_id:
        emit('error', {'message': 'assessment_id is required'})
        return
    
    try:
        from app.models import Assessment
        assessment = Assessment.query.get(assessment_id)
        
        if not assessment:
            emit('error', {'message': 'Assessment not found'})
            return
        
        emit('assessment_status', {
            'assessment_id': assessment_id,
            'status': assessment.status,
            'progress': assessment.get_progress(),
            'current_test': len(assessment.test_results),
            'total_tests': assessment.total_prompts
        })
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('start_assessment')
def handle_start_assessment(data=None):
    """Handle starting a new assessment from frontend."""
    client_id = request.sid
    print(f"START ASSESSMENT: Client {client_id} requested assessment start")
    print(f"Data received: {data}")
    
    try:
        # Create a new assessment
        from app.models import Assessment
        from app import db
        
        # Extract setup data if provided
        if data and isinstance(data, dict):
            provider = data.get('selectedProvider', 'openai')
            model = data.get('selectedModel', 'gpt-3.5-turbo')
            
            # Get API key from nested apiKeys object
            api_keys = data.get('apiKeys', {})
            api_key = api_keys.get(provider, '') if api_keys else data.get('apiKey', '')
            
            config = data.get('assessmentConfig', {})
            categories = config.get('testCategories', ['jailbreak', 'bias'])
            total_prompts = config.get('assessmentScope', {}).get('totalPrompts', 20)
            assessment_name = config.get('name', 'Dashboard Assessment')
        else:
            # Default values
            provider = 'openai'
            model = 'gpt-3.5-turbo'
            api_key = ''
            categories = ['jailbreak', 'bias']
            total_prompts = 20
            assessment_name = 'Quick Assessment'
            
        # Validate API key is provided
        if not api_key:
            emit('error', {'message': 'API key is required to start assessment'})
            return
        
        # Calculate prompts per category
        prompts_per_category = max(1, total_prompts // len(categories))
        actual_total_prompts = prompts_per_category * len(categories)
        
        # Create assessment in database
        assessment = Assessment(
            name=assessment_name,
            description='Assessment started from dashboard',
            llm_provider=provider,
            model_name=model,
            test_categories=categories,
            total_prompts=actual_total_prompts,
            status='running'
        )
        
        db.session.add(assessment)
        db.session.commit()
        
        print(f"Created assessment ID: {assessment.id}")
        
        # Subscribe client to this assessment
        room_name = f'assessment_{assessment.id}'
        join_room(room_name)
        
        # Emit acknowledgment
        emit('assessment_started', {
            'assessment_id': assessment.id,
            'status': 'running',
            'message': 'Assessment started successfully'
        })
        
        # Test: Send a simple test event immediately
        emit('test_event', {'message': 'Test event from start_assessment handler'})
        print(f"SENT test_event to client {client_id}")
        
        # Start the real assessment using the assessment service with API key
        from app.services.assessment import AssessmentService
        AssessmentService.run_assessment_async(assessment.id, api_key=api_key)
        

        
        logging.info(f"Assessment {assessment.id} started by client {client_id}")
        
    except Exception as e:
        print(f"Error starting assessment: {str(e)}")
        emit('error', {'message': f'Failed to start assessment: {str(e)}'})

@socketio.on('pause_assessment')
def handle_pause_assessment(data=None):
    """Handle pausing an assessment."""
    client_id = request.sid
    print(f"PAUSE ASSESSMENT: Client {client_id} requested pause")
    
    emit('assessment_paused', {
        'message': 'Assessment paused',
        'status': 'paused'
    })

@socketio.on('resume_assessment')
def handle_resume_assessment(data=None):
    """Handle resuming an assessment."""
    client_id = request.sid
    print(f"RESUME ASSESSMENT: Client {client_id} requested resume")
    
    emit('assessment_resumed', {
        'message': 'Assessment resumed',
        'status': 'running'
    })

@socketio.on('stop_assessment')
def handle_stop_assessment(data=None):
    """Handle stopping an assessment."""
    client_id = request.sid
    print(f"STOP ASSESSMENT: Client {client_id} requested stop")
    
    emit('assessment_stopped', {
        'message': 'Assessment stopped',
        'status': 'completed'
    })

# Server-side events for broadcasting updates
def broadcast_assessment_started(assessment_id, assessment_data):
    """Broadcast when an assessment starts."""
    socketio.emit('assessment_started', {
        'assessment_id': assessment_id,
        'assessment': assessment_data,
        'timestamp': datetime.now().isoformat()
    }, room=f'assessment_{assessment_id}')
    
    logging.info(f"Broadcast: Assessment {assessment_id} started")

def broadcast_test_completed(assessment_id, test_result):
    """Broadcast when a test completes."""
    socketio.emit('test_completed', {
        'assessment_id': assessment_id,
        'result': test_result,
        'timestamp': datetime.now().isoformat()
    }, room=f'assessment_{assessment_id}')
    
    logging.info(f"Broadcast: Test completed for assessment {assessment_id}")

def broadcast_assessment_progress(assessment_id, progress_data):
    """Broadcast assessment progress updates."""
    socketio.emit('assessment_progress', {
        'assessment_id': assessment_id,
        'progress': progress_data,
        'timestamp': datetime.now().isoformat()
    }, room=f'assessment_{assessment_id}')

def broadcast_assessment_completed(assessment_id, final_results):
    """Broadcast when an assessment completes."""
    socketio.emit('assessment_completed', {
        'assessment_id': assessment_id,
        'results': final_results,
        'timestamp': datetime.now().isoformat()
    }, room=f'assessment_{assessment_id}')
    
    logging.info(f"Broadcast: Assessment {assessment_id} completed")

def broadcast_vulnerability_detected(assessment_id, vulnerability_data):
    """Broadcast when a high-risk vulnerability is detected."""
    socketio.emit('vulnerability_detected', {
        'assessment_id': assessment_id,
        'vulnerability': vulnerability_data,
        'timestamp': datetime.now().isoformat(),
        'severity': vulnerability_data.get('risk_level', 'unknown')
    }, room=f'assessment_{assessment_id}')
    
    logging.warning(f"Vulnerability detected in assessment {assessment_id}")

def broadcast_assessment_error(assessment_id, error_data):
    """Broadcast when an assessment encounters an error."""
    socketio.emit('assessment_error', {
        'assessment_id': assessment_id,
        'error': error_data,
        'timestamp': datetime.now().isoformat()
    }, room=f'assessment_{assessment_id}')
    
    logging.error(f"Assessment {assessment_id} error: {error_data}")

def get_connected_clients():
    """Get count of connected clients."""
    return len(active_connections)

def get_assessment_subscribers(assessment_id):
    """Get count of clients subscribed to an assessment."""
    count = 0
    for client_data in active_connections.values():
        if assessment_id in client_data['subscribed_assessments']:
            count += 1
    return count

def send_assessment_update(assessment_id, event_type, data):
    """Send assessment update via WebSocket."""
    # Import socketio with error handling for background threads
    try:
        from app import socketio
    except ImportError:
        # Fallback for background threads
        from flask import current_app
        socketio = current_app.extensions['socketio']
    
    # Send to specific room AND broadcast globally for dashboard
    message_data = {
        'assessment_id': assessment_id,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    
    # Debug logging and validation for test_completed events
    if event_type == 'test_completed':
        print(f"DEBUG send_assessment_update test_completed data: {data}")
        if 'category' in data and 'prompt' not in data:
            print(f"WARNING: test_completed event missing 'prompt' field! Adding fallback. Data: {data}")
            # Add fallback prompt text to prevent frontend errors
            data['prompt'] = f"{data.get('category', 'unknown')} test prompt"
            message_data['data'] = data
    
    # Send to specific assessment room
    socketio.emit(event_type, message_data, room=f'assessment_{assessment_id}')
    
    # Also broadcast globally so dashboard receives it
    socketio.emit(event_type, message_data)
    
    # Additional debug: Force send to all connected clients
    for client_id in active_connections.keys():
        socketio.emit(event_type, message_data, to=client_id)
    
    print(f"WEBSOCKET SEND: {event_type} for assessment {assessment_id}")
    print(f"Connected clients: {len(active_connections)}")
    
    logging.info(f"Sent {event_type} update for assessment {assessment_id}")