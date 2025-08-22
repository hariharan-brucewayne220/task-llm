"""
Simple Flask API server for red team testing
Simplified version that definitely works
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
from datetime import datetime

# Simple Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# In-memory storage for demo
assessments = {}
results = {}
assessment_counter = 0

@app.route('/api/assessments', methods=['GET'])
def list_assessments():
    """List all assessments."""
    return jsonify({
        'assessments': list(assessments.values()),
        'total': len(assessments)
    })

@app.route('/api/assessments', methods=['POST'])
def create_assessment():
    """Create a new assessment."""
    global assessment_counter
    assessment_counter += 1
    
    data = request.get_json()
    
    assessment = {
        'id': assessment_counter,
        'name': data.get('name', 'Test Assessment'),
        'description': data.get('description', ''),
        'llm_provider': data.get('llm_provider', 'openai'),
        'model_name': data.get('model_name', 'gpt-3.5-turbo'),
        'test_categories': data.get('test_categories', ['jailbreak', 'bias']),
        'status': 'pending',
        'total_prompts': len(data.get('test_categories', [])) * 3,  # 3 prompts per category
        'completed_prompts': 0,
        'progress_percent': 0,
        'created_at': datetime.now().isoformat(),
        'started_at': None,
        'completed_at': None
    }
    
    assessments[assessment_counter] = assessment
    
    return jsonify({
        'success': True,
        'assessment': assessment
    }), 201

@app.route('/api/assessments/<int:assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    """Get assessment details."""
    if assessment_id not in assessments:
        return jsonify({'error': 'Assessment not found'}), 404
    
    assessment = assessments[assessment_id]
    progress = {
        'progress_percent': assessment['progress_percent'],
        'completed_prompts': assessment['completed_prompts'],
        'total_prompts': assessment['total_prompts']
    }
    
    return jsonify({
        'assessment': assessment,
        'progress': progress
    })

@app.route('/api/assessments/<int:assessment_id>/run', methods=['POST'])
def run_assessment(assessment_id):
    """Start running an assessment."""
    if assessment_id not in assessments:
        return jsonify({'error': 'Assessment not found'}), 404
    
    assessment = assessments[assessment_id]
    
    if assessment['status'] != 'pending':
        return jsonify({'error': 'Assessment already started or completed'}), 400
    
    # Update assessment status
    assessment['status'] = 'running'
    assessment['started_at'] = datetime.now().isoformat()
    
    # Simulate running assessment (in real version this would be async)
    print(f"Starting assessment {assessment_id}")
    print(f"   Provider: {assessment['llm_provider']}")
    print(f"   Model: {assessment['model_name']}")
    print(f"   Categories: {assessment['test_categories']}")
    
    return jsonify({
        'success': True,
        'message': 'Assessment started',
        'assessment': assessment
    })

@app.route('/api/results/<int:assessment_id>', methods=['GET'])
def get_results(assessment_id):
    """Get assessment results."""
    if assessment_id not in assessments:
        return jsonify({'error': 'Assessment not found'}), 404
    
    assessment = assessments[assessment_id]
    
    # Return empty metrics structure - will be populated by real assessment
    metrics = {
        'total_tests': assessment['total_prompts'],
        'safeguard_success_rate': 0,
        'average_response_time': 0,
        'average_response_length': 0,
        'average_vulnerability_score': 0,
        'risk_distribution': {
            'low': 0,
            'medium': 0,
            'high': 0,
            'critical': 0
        },
        'assessment_summary': {
            'strengths': ['Assessment in progress'],
            'weaknesses': ['No data available yet'],
            'potential_flaws': ['Continue monitoring']
        }
    }
    
    return jsonify({
        'assessment': assessment,
        'metrics': metrics,
        'results_by_category': {},
        'total_results': assessment['completed_prompts']
    })

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'running',
        'service': 'Red Team API',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            '/api/assessments',
            '/api/assessments/<id>',
            '/api/assessments/<id>/run',
            '/api/results/<id>'
        ]
    })

if __name__ == '__main__':
    print("Starting Simple Red Team API Server")
    print("   API: http://localhost:5001")
    print("   Dashboard: http://localhost:3000")
    print("   WebSocket: Make sure websocket_server.py is running")
    print()
    
    app.run(host='127.0.0.1', port=5001, debug=True)