"""Assessment API endpoints."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models import Assessment, Prompt
from app.services.assessment import AssessmentService
from app.utils.validators import validate_assessment_data
from app.services.llm_client import LLMClientFactory
import os

bp = Blueprint('assessments', __name__)

@bp.route('/assessments', methods=['POST'])
def create_assessment():
    """Create a new red team assessment."""
    try:
        data = request.get_json()
        
        # Validate input data
        validation_result = validate_assessment_data(data)
        if not validation_result['valid']:
            return jsonify({'error': validation_result['message']}), 400
        
        # Create assessment
        assessment = Assessment(
            name=data['name'],
            description=data.get('description', ''),
            llm_provider=data['llm_provider'],
            model_name=data['model_name'],
            test_categories=data['test_categories'],
            status='pending'
        )
        
        # Calculate total prompts based on categories
        total_prompts = 0
        for category in data['test_categories']:
            prompts = Prompt.get_by_category(category)
            total_prompts += len(prompts)
        
        assessment.total_prompts = total_prompts
        
        db.session.add(assessment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'assessment': assessment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/assessments', methods=['GET'])
def list_assessments():
    """List all assessments with pagination."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        assessments = Assessment.query.order_by(
            Assessment.created_at.desc()
        ).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'assessments': [a.to_dict() for a in assessments.items],
            'total': assessments.total,
            'pages': assessments.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/assessments/<int:assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    """Get assessment details by ID."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        return jsonify({
            'assessment': assessment.to_dict(),
            'progress': assessment.get_progress()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/connection-test', methods=['POST'])
def test_connection():
    """Test LLM API connection and broadcast WebSocket event."""
    try:
        from app import socketio
        
        data = request.get_json()
        provider = data.get('provider', 'openai')
        model = data.get('model', 'gpt-3.5-turbo')
        
        # Get API key from request (UI-provided only)
        api_key = data.get('api_key') or data.get('apiKey')
        
        if not api_key:
            # Send failed connection test
            socketio.emit('connection_test', {
                'status': 'failed',
                'provider': provider,
                'model': model,
                'error': f'No API key configured for {provider}'
            })
            return jsonify({
                'success': False, 
                'error': f'No API key configured for {provider}'
            }), 400
        
        # Test connection
        try:
            client = LLMClientFactory.create_client(provider, api_key, model)
            result = client.test_connection()
            
            if result['success']:
                # Send successful connection test
                socketio.emit('connection_test', {
                    'status': 'success',
                    'provider': provider,
                    'model': model,
                    'response_time': result.get('response_time', 0)
                })
                return jsonify({
                    'success': True,
                    'provider': provider,
                    'model': model,
                    'response_time': result.get('response_time', 0)
                })
            else:
                # Send failed connection test
                socketio.emit('connection_test', {
                    'status': 'failed',
                    'provider': provider,
                    'model': model,
                    'error': result.get('error', 'Connection failed')
                })
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Connection failed')
                }), 400
                
        except Exception as e:
            # Send failed connection test
            socketio.emit('connection_test', {
                'status': 'failed',
                'provider': provider,
                'model': model,
                'error': str(e)
            })
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/assessments/<int:assessment_id>/run', methods=['POST'])
def run_assessment(assessment_id):
    """Start running an assessment using AssessmentService."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        if assessment.status != 'pending':
            return jsonify({
                'error': 'Assessment must be in pending status to run'
            }), 400
        
        # Get API key from request (UI-provided)
        data = request.get_json() or {}
        api_key = data.get('api_key') or data.get('apiKey')
        
        if not api_key:
            return jsonify({'error': f'API key required for provider: {assessment.llm_provider}'}), 400
        
        # Delegate to AssessmentService for clean architecture
        AssessmentService.run_assessment_async(assessment_id, api_key)
        
        return jsonify({
            'success': True,
            'message': 'Assessment started',
            'assessment': assessment.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/assessments/<int:assessment_id>/stop', methods=['POST'])
def stop_assessment(assessment_id):
    """Stop a running assessment."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        if assessment.status != 'running':
            return jsonify({
                'error': 'Assessment is not currently running'
            }), 400
        
        # Stop assessment
        AssessmentService.stop_assessment(assessment_id)
        
        assessment.status = 'stopped'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Assessment stopped'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/assessments/<int:assessment_id>', methods=['DELETE'])
def delete_assessment(assessment_id):
    """Delete an assessment and all its results."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        if assessment.status == 'running':
            return jsonify({
                'error': 'Cannot delete running assessment'
            }), 400
        
        db.session.delete(assessment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Assessment deleted'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500