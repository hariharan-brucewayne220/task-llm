"""Scheduled Assessment API endpoints."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.scheduled_assessment import ScheduledAssessment
import logging

logger = logging.getLogger(__name__)

scheduled_assessments_bp = Blueprint('scheduled_assessments', __name__)

@scheduled_assessments_bp.route('/scheduled-assessments', methods=['GET'])
def get_scheduled_assessments():
    """Get all scheduled assessments."""
    try:
        assessments = ScheduledAssessment.query.order_by(ScheduledAssessment.next_run.asc()).all()
        
        return jsonify({
            'success': True,
            'assessments': [assessment.to_dict() for assessment in assessments],
            'count': len(assessments)
        })
        
    except Exception as e:
        logger.error(f"Error fetching scheduled assessments: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'assessments': []
        }), 500

@scheduled_assessments_bp.route('/scheduled-assessments', methods=['POST'])
def create_scheduled_assessment():
    """Create a new scheduled assessment."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'provider', 'model', 'categories', 'schedule']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Create new scheduled assessment
        scheduled_assessment = ScheduledAssessment(
            name=data['name'],
            description=data.get('description', ''),
            provider=data['provider'],
            model=data['model'],
            categories=data['categories'],
            schedule=data['schedule'],
            is_active=True
        )
        
        # Calculate next run time
        scheduled_assessment.calculate_next_run()
        
        db.session.add(scheduled_assessment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'assessment': scheduled_assessment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating scheduled assessment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduled_assessments_bp.route('/scheduled-assessments/<int:assessment_id>', methods=['PUT'])
def update_scheduled_assessment(assessment_id):
    """Update a scheduled assessment."""
    try:
        assessment = ScheduledAssessment.query.get_or_404(assessment_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            assessment.name = data['name']
        if 'description' in data:
            assessment.description = data['description']
        if 'provider' in data:
            assessment.provider = data['provider']
        if 'model' in data:
            assessment.model = data['model']
        if 'categories' in data:
            assessment.categories = data['categories']
        if 'schedule' in data:
            assessment.schedule = data['schedule']
            # Recalculate next run if schedule changed
            assessment.calculate_next_run()
        if 'isActive' in data:
            assessment.is_active = data['isActive']
        
        assessment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'assessment': assessment.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating scheduled assessment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduled_assessments_bp.route('/scheduled-assessments/<int:assessment_id>', methods=['DELETE'])
def delete_scheduled_assessment(assessment_id):
    """Delete a scheduled assessment."""
    try:
        assessment = ScheduledAssessment.query.get_or_404(assessment_id)
        
        db.session.delete(assessment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Scheduled assessment deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting scheduled assessment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduled_assessments_bp.route('/scheduled-assessments/<int:assessment_id>/toggle', methods=['POST'])
def toggle_scheduled_assessment(assessment_id):
    """Toggle active status of a scheduled assessment."""
    try:
        assessment = ScheduledAssessment.query.get_or_404(assessment_id)
        
        assessment.is_active = not assessment.is_active
        assessment.updated_at = datetime.utcnow()
        
        # If reactivating, recalculate next run
        if assessment.is_active:
            assessment.calculate_next_run()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'assessment': assessment.to_dict(),
            'message': f'Assessment {"activated" if assessment.is_active else "deactivated"} successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling scheduled assessment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduled_assessments_bp.route('/scheduled-assessments/due', methods=['GET'])
def get_due_assessments():
    """Get assessments that are due to run."""
    try:
        due_assessments = ScheduledAssessment.get_due_assessments()
        
        return jsonify({
            'success': True,
            'assessments': [assessment.to_dict() for assessment in due_assessments],
            'count': len(due_assessments)
        })
        
    except Exception as e:
        logger.error(f"Error fetching due assessments: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'assessments': []
        }), 500

