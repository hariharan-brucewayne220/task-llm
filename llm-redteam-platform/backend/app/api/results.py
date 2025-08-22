"""Results API endpoints."""
from flask import Blueprint, request, jsonify
from sqlalchemy import and_
from app import db
from app.models import Assessment, TestResult
from app.services.metrics import MetricsService

bp = Blueprint('results', __name__)

@bp.route('/results/<int:assessment_id>', methods=['GET'])
def get_assessment_results(assessment_id):
    """Get detailed results for an assessment."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        # Get all test results for this assessment
        results = TestResult.query.filter_by(
            assessment_id=assessment_id
        ).order_by(TestResult.created_at.desc()).all()
        
        # Calculate metrics
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        # Group results by category
        results_by_category = {}
        for result in results:
            category = result.category
            if category not in results_by_category:
                results_by_category[category] = []
            results_by_category[category].append(result.to_dict())
        
        return jsonify({
            'assessment': assessment.to_dict(),
            'metrics': metrics,
            'results_by_category': results_by_category,
            'total_results': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<int:assessment_id>/summary', methods=['GET'])
def get_results_summary(assessment_id):
    """Get summary metrics for an assessment."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        metrics = MetricsService.calculate_assessment_metrics(assessment)
        
        return jsonify({
            'assessment_id': assessment_id,
            'metrics': metrics,
            'status': assessment.status
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<int:assessment_id>/category/<category>', methods=['GET'])
def get_category_results(assessment_id, category):
    """Get results for a specific category."""
    try:
        assessment = Assessment.query.get_or_404(assessment_id)
        
        results = TestResult.query.filter(
            and_(
                TestResult.assessment_id == assessment_id,
                TestResult.category == category
            )
        ).order_by(TestResult.vulnerability_score.desc()).all()
        
        # Calculate category-specific metrics
        category_metrics = MetricsService.calculate_category_metrics(
            assessment_id, category
        )
        
        return jsonify({
            'category': category,
            'results': [r.to_dict() for r in results],
            'metrics': category_metrics,
            'total_results': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<int:assessment_id>/vulnerabilities', methods=['GET'])
def get_vulnerabilities(assessment_id):
    """Get high-risk vulnerabilities for an assessment."""
    try:
        # Get results with vulnerability score > 6.0
        high_risk_results = TestResult.query.filter(
            and_(
                TestResult.assessment_id == assessment_id,
                TestResult.vulnerability_score > 6.0
            )
        ).order_by(TestResult.vulnerability_score.desc()).all()
        
        vulnerabilities = []
        for result in high_risk_results:
            vulnerabilities.append({
                'id': result.id,
                'category': result.category,
                'prompt_text': result.prompt_text[:100] + '...',
                'vulnerability_score': result.vulnerability_score,
                'risk_level': result.risk_level,
                'safeguard_triggered': result.safeguard_triggered,
                'response_preview': result.response_text[:200] + '...' if result.response_text else None
            })
        
        return jsonify({
            'vulnerabilities': vulnerabilities,
            'total_count': len(vulnerabilities)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<int:result_id>/detail', methods=['GET'])
def get_result_detail(result_id):
    """Get detailed information for a specific test result."""
    try:
        result = TestResult.query.get_or_404(result_id)
        
        return jsonify({
            'result': result.to_dict(),
            'prompt': result.prompt.to_dict() if result.prompt else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/<int:assessment_id>/export', methods=['GET'])
def export_results(assessment_id):
    """Export assessment results in various formats."""
    try:
        format_type = request.args.get('format', 'json')
        
        assessment = Assessment.query.get_or_404(assessment_id)
        results = TestResult.query.filter_by(
            assessment_id=assessment_id
        ).all()
        
        if format_type == 'csv':
            return MetricsService.export_to_csv(assessment, results)
        elif format_type == 'pdf':
            return MetricsService.export_to_pdf(assessment, results)
        else:
            # Default JSON export
            return jsonify({
                'assessment': assessment.to_dict(),
                'results': [r.to_dict() for r in results],
                'metrics': MetricsService.calculate_assessment_metrics(assessment)
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/results/compare', methods=['POST'])
def compare_assessments():
    """Compare results between multiple assessments."""
    try:
        data = request.get_json()
        assessment_ids = data.get('assessment_ids', [])
        
        if len(assessment_ids) < 2:
            return jsonify({
                'error': 'At least 2 assessments required for comparison'
            }), 400
        
        comparison = MetricsService.compare_assessments(assessment_ids)
        
        return jsonify({
            'comparison': comparison
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500