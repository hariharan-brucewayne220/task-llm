"""Assessment history model for tracking all completed assessments."""
from datetime import datetime
from app import db
import json


class AssessmentHistory(db.Model):
    """Model to store complete history of all assessments for tracking purposes."""
    __tablename__ = 'assessment_history'

    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, nullable=False)
    
    # Model information
    model_name = db.Column(db.String(100), nullable=False)
    provider = db.Column(db.String(50), nullable=False)
    
    # Assessment configuration
    test_categories = db.Column(db.Text)  # JSON array of categories tested
    total_prompts = db.Column(db.Integer, default=0)
    
    # Performance metrics
    overall_vulnerability_score = db.Column(db.Float, default=0.0)
    safeguard_success_rate = db.Column(db.Float, default=0.0)
    average_response_time = db.Column(db.Float, default=0.0)
    average_response_length = db.Column(db.Float, default=0.0)
    
    # Risk distribution counts
    risk_distribution_low = db.Column(db.Integer, default=0)
    risk_distribution_medium = db.Column(db.Integer, default=0)
    risk_distribution_high = db.Column(db.Integer, default=0)
    risk_distribution_critical = db.Column(db.Integer, default=0)
    
    # Category performance breakdown
    category_breakdown = db.Column(db.Text)  # JSON object with category scores
    
    # Advanced metrics (optional)
    bleu_score_factual = db.Column(db.Float)
    sentiment_bias_score = db.Column(db.Float)
    consistency_score = db.Column(db.Float)
    advanced_metrics_available = db.Column(db.Boolean, default=False)
    
    # Assessment analysis
    strengths = db.Column(db.Text)  # JSON array of strengths identified
    weaknesses = db.Column(db.Text)  # JSON array of weaknesses identified
    potential_flaws = db.Column(db.Text)  # JSON array of potential security flaws
    security_recommendation = db.Column(db.String(500))
    
    # Assessment status
    status = db.Column(db.String(50), default='completed')
    error_message = db.Column(db.Text)
    
    # Timestamps
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert assessment history to dictionary."""
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'model_name': self.model_name,
            'provider': self.provider,
            'test_categories': json.loads(self.test_categories) if self.test_categories else [],
            'total_prompts': self.total_prompts,
            'overall_vulnerability_score': self.overall_vulnerability_score,
            'safeguard_success_rate': self.safeguard_success_rate,
            'average_response_time': self.average_response_time,
            'average_response_length': self.average_response_length,
            'risk_distribution': {
                'low': self.risk_distribution_low,
                'medium': self.risk_distribution_medium,
                'high': self.risk_distribution_high,
                'critical': self.risk_distribution_critical
            },
            'category_breakdown': json.loads(self.category_breakdown) if self.category_breakdown else {},
            'bleu_score_factual': self.bleu_score_factual,
            'sentiment_bias_score': self.sentiment_bias_score,
            'consistency_score': self.consistency_score,
            'advanced_metrics_available': self.advanced_metrics_available,
            'strengths': json.loads(self.strengths) if self.strengths else [],
            'weaknesses': json.loads(self.weaknesses) if self.weaknesses else [],
            'potential_flaws': json.loads(self.potential_flaws) if self.potential_flaws else [],
            'security_recommendation': self.security_recommendation,
            'status': self.status,
            'error_message': self.error_message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @staticmethod
    def create_from_assessment(assessment, metrics, assessment_id):
        """Create new assessment history record from completed assessment."""
        risk_dist = metrics.get('risk_distribution', {})
        category_breakdown = metrics.get('category_breakdown', {})
        assessment_summary = metrics.get('assessment_summary', {})
        
        new_history = AssessmentHistory(
            assessment_id=assessment_id,
            model_name=assessment.model_name,
            provider=assessment.llm_provider,
            test_categories=json.dumps(assessment.test_categories),
            total_prompts=assessment.total_prompts or 0,
            overall_vulnerability_score=metrics.get('overall_vulnerability_score', 0.0),
            safeguard_success_rate=metrics.get('safeguard_success_rate', 0.0),
            average_response_time=metrics.get('average_response_time', 0.0),
            average_response_length=metrics.get('average_response_length', 0.0),
            risk_distribution_low=risk_dist.get('low', 0),
            risk_distribution_medium=risk_dist.get('medium', 0),
            risk_distribution_high=risk_dist.get('high', 0),
            risk_distribution_critical=risk_dist.get('critical', 0),
            category_breakdown=json.dumps(category_breakdown),
            bleu_score_factual=metrics.get('bleu_score_factual'),
            sentiment_bias_score=metrics.get('sentiment_bias_score'),
            consistency_score=metrics.get('consistency_score'),
            advanced_metrics_available=metrics.get('advanced_metrics_available', False),
            strengths=json.dumps(assessment_summary.get('strengths', [])),
            weaknesses=json.dumps(assessment_summary.get('weaknesses', [])),
            potential_flaws=json.dumps(assessment_summary.get('potential_flaws', [])),
            security_recommendation=metrics.get('security_recommendation', ''),
            status=assessment.status,
            error_message=getattr(assessment, 'error_message', None),
            started_at=assessment.started_at,
            completed_at=assessment.completed_at
        )
        
        db.session.add(new_history)
        db.session.commit()
        return new_history

    @staticmethod
    def get_recent_history(limit=10):
        """Get recent assessment history (latest first)."""
        return AssessmentHistory.query.order_by(
            AssessmentHistory.completed_at.desc()
        ).limit(limit).all()

    @staticmethod
    def get_model_history(model_name, provider, limit=5):
        """Get assessment history for specific model."""
        return AssessmentHistory.query.filter_by(
            model_name=model_name,
            provider=provider
        ).order_by(
            AssessmentHistory.completed_at.desc()
        ).limit(limit).all()