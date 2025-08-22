"""API endpoints for model comparison data."""
from flask import Blueprint, jsonify, request
from app.models.model_comparison import ModelComparison
import logging

logger = logging.getLogger(__name__)

model_comparisons_bp = Blueprint('model_comparisons', __name__)

@model_comparisons_bp.route('/api/model-comparisons', methods=['GET'])
def get_all_model_comparisons():
    """Get all model comparison records for chart visualization."""
    try:
        models = ModelComparison.get_all_models()
        
        # Format data for Plotly charts
        comparison_data = []
        for model in models:
            model_dict = model.to_dict()
            comparison_data.append(model_dict)
        
        return jsonify({
            'success': True,
            'comparisons': comparison_data,
            'count': len(comparison_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching model comparisons: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'comparisons': []
        }), 500

@model_comparisons_bp.route('/api/model-comparisons/<model_name>/<provider>', methods=['GET'])
def get_model_history(model_name, provider):
    """Get historical data for a specific model."""
    try:
        history = ModelComparison.get_model_history(model_name, provider)
        
        history_data = []
        for record in history:
            history_data.append(record.to_dict())
        
        return jsonify({
            'success': True,
            'history': history_data,
            'model_name': model_name,
            'provider': provider,
            'count': len(history_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching model history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'history': []
        }), 500

@model_comparisons_bp.route('/api/model-comparisons/chart-data', methods=['GET'])
def get_chart_data():
    """Get formatted data specifically for chart visualization."""
    try:
        models = ModelComparison.get_all_models()
        
        # Format data for different chart types
        bar_chart_data = {
            'models': [],
            'vulnerability_scores': [],
            'safeguard_rates': [],
            'response_times': []
        }
        
        radial_chart_data = []
        
        risk_distribution_data = {
            'models': [],
            'low': [],
            'medium': [],
            'high': [],
            'critical': []
        }
        
        for model in models:
            model_label = f"{model.model_name} ({model.provider})"
            
            # Bar chart data
            bar_chart_data['models'].append(model_label)
            bar_chart_data['vulnerability_scores'].append(model.overall_vulnerability_score)
            bar_chart_data['safeguard_rates'].append(model.safeguard_success_rate)
            bar_chart_data['response_times'].append(model.average_response_time)
            
            # Risk distribution data
            risk_distribution_data['models'].append(model_label)
            risk_distribution_data['low'].append(model.risk_distribution_low)
            risk_distribution_data['medium'].append(model.risk_distribution_medium)
            risk_distribution_data['high'].append(model.risk_distribution_high)
            risk_distribution_data['critical'].append(model.risk_distribution_critical)
            
            # Radial chart data (for individual model breakdown)
            total_tests = (model.risk_distribution_low + model.risk_distribution_medium + 
                          model.risk_distribution_high + model.risk_distribution_critical)
            
            if total_tests > 0:
                radial_chart_data.append({
                    'model': model_label,
                    'low': (model.risk_distribution_low / total_tests) * 100,
                    'medium': (model.risk_distribution_medium / total_tests) * 100,
                    'high': (model.risk_distribution_high / total_tests) * 100,
                    'critical': (model.risk_distribution_critical / total_tests) * 100,
                    'total_tests': total_tests,
                    'vulnerability_score': model.overall_vulnerability_score,
                    'safeguard_rate': model.safeguard_success_rate
                })
        
        return jsonify({
            'success': True,
            'bar_chart': bar_chart_data,
            'radial_chart': radial_chart_data,
            'risk_distribution': risk_distribution_data,
            'total_models': len(models)
        })
        
    except Exception as e:
        logger.error(f"Error fetching chart data: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'bar_chart': {'models': [], 'vulnerability_scores': [], 'safeguard_rates': [], 'response_times': []},
            'radial_chart': [],
            'risk_distribution': {'models': [], 'low': [], 'medium': [], 'high': [], 'critical': []}
        }), 500