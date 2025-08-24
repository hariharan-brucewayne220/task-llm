"""Report generation API endpoints."""
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
import os
import tempfile
from app import db
from app.models import Assessment
from generate_assessment_report import AssessmentReportGenerator

bp = Blueprint('reports', __name__)

@bp.route('/reports/comprehensive/<int:assessment_id>', methods=['GET'])
def generate_comprehensive_report(assessment_id):
    """Generate comprehensive PDF report for an assessment."""
    try:
        # Check if assessment exists and is completed
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
            
        if assessment.status != 'completed':
            return jsonify({'error': 'Assessment must be completed to generate report'}), 400
        
        # Generate report in temp directory
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as tmp_file:
            temp_path = tmp_file.name
        
        # Generate the report
        generator = AssessmentReportGenerator(assessment_id)
        output_path = generator.generate_report(temp_path)
        
        # Generate download filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        download_name = f"comprehensive_assessment_report_{assessment.model_name}_{timestamp}.pdf"
        
        # Send file and delete after sending
        def remove_file(response):
            try:
                os.remove(temp_path)
            except Exception:
                pass
            return response
        
        return send_file(
            output_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=download_name
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/reports/comprehensive/<int:assessment_id>/check', methods=['GET'])
def check_report_availability(assessment_id):
    """Check if comprehensive report can be generated for an assessment."""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({'available': False, 'reason': 'Assessment not found'}), 404
            
        if assessment.status != 'completed':
            return jsonify({'available': False, 'reason': 'Assessment not completed'}), 200
            
        # Check if assessment has test results
        if len(assessment.test_results) == 0:
            return jsonify({'available': False, 'reason': 'No test results found'}), 200
            
        return jsonify({
            'available': True,
            'assessment_name': assessment.name,
            'model': assessment.model_name,
            'provider': assessment.llm_provider,
            'test_count': len(assessment.test_results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500