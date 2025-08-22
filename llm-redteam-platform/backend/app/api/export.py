"""Export API endpoints."""
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
import json
import csv
import io
from app.models import Assessment, TestResult
from app.services.metrics import MetricsService

bp = Blueprint('export', __name__)

@bp.route('/export/<int:assessment_id>/json', methods=['GET'])
def export_json(assessment_id):
    """Export assessment results as JSON."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        export_data = {
            'export_metadata': {
                'timestamp': datetime.utcnow().isoformat(),
                'assessment_id': assessment_id,
                'total_results': len(results)
            },
            'assessment': assessment.to_dict(),
            'metrics': metrics,
            'results': [r.to_dict() for r in results]
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/csv', methods=['GET'])
def export_csv(assessment_id):
    """Export assessment results as CSV."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Category', 'Prompt', 'Response Preview', 
            'Vulnerability Score', 'Risk Level', 'Safeguard Triggered',
            'Response Time', 'Word Count', 'Created At'
        ])
        
        # Write data rows
        for result in results:
            writer.writerow([
                result.id,
                result.category,
                result.prompt_text[:100] + '...' if len(result.prompt_text) > 100 else result.prompt_text,
                result.response_text[:100] + '...' if result.response_text and len(result.response_text) > 100 else result.response_text,
                result.vulnerability_score,
                result.risk_level,
                result.safeguard_triggered,
                result.response_time,
                result.word_count,
                result.created_at.isoformat() if result.created_at else ''
            ])
        
        # Create file response
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            attachment_filename=f'assessment_{assessment_id}_results.csv'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/report', methods=['GET'])
def export_report(assessment_id):
    """Export comprehensive assessment report."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(assessment_id=assessment_id).all()
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        # Generate comprehensive report
        report = {
            'report_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'assessment_id': assessment_id,
                'assessment_name': assessment.name,
                'total_tests': len(results)
            },
            'executive_summary': {
                'overall_score': assessment.overall_score,
                'safeguard_success_rate': assessment.safeguard_success_rate,
                'total_vulnerabilities': len([r for r in results if r.vulnerability_score > 6.0]),
                'high_risk_findings': len([r for r in results if r.risk_level == 'high']),
                'critical_findings': len([r for r in results if r.risk_level == 'critical'])
            },
            'detailed_metrics': metrics,
            'vulnerability_breakdown': MetricsService.get_vulnerability_breakdown(assessment_id),
            'category_analysis': MetricsService.get_category_analysis(assessment_id),
            'recommendations': MetricsService.generate_recommendations(assessment),
            'high_risk_results': [
                r.to_dict() for r in results 
                if r.vulnerability_score > 7.0
            ]
        }
        
        return jsonify(report)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<int:assessment_id>/summary', methods=['GET'])
def export_summary(assessment_id):
    """Export assessment summary for integration with external systems."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        summary = {
            'assessment_id': assessment_id,
            'name': assessment.name,
            'status': assessment.status,
            'llm_provider': assessment.llm_provider,
            'model_name': assessment.model_name,
            'test_categories': assessment.test_categories,
            'started_at': assessment.started_at.isoformat() if assessment.started_at else None,
            'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
            'key_metrics': {
                'overall_vulnerability_score': assessment.overall_score,
                'safeguard_success_rate': assessment.safeguard_success_rate,
                'total_tests': assessment.total_prompts,
                'avg_response_time': assessment.avg_response_time
            },
            'risk_summary': metrics.get('risk_distribution', {}),
            'compliance_status': MetricsService.get_compliance_status(assessment)
        }
        
        return jsonify(summary)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/compare', methods=['POST'])
def export_comparison(assessment_ids):
    """Export comparison between multiple assessments."""
    try:
        data = request.get_json()
        assessment_ids = data.get('assessment_ids', [])
        
        if len(assessment_ids) < 2:
            return jsonify({
                'error': 'At least 2 assessments required for comparison'
            }), 400
        
        comparison = MetricsService.compare_assessments(assessment_ids)
        
        # Add export metadata
        comparison['export_metadata'] = {
            'generated_at': datetime.utcnow().isoformat(),
            'assessment_count': len(assessment_ids),
            'comparison_type': 'multi_assessment'
        }
        
        return jsonify(comparison)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500