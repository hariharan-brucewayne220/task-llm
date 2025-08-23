"""Model comparison database model for tracking performance across different models."""
from datetime import datetime
from app import db


class ModelComparison(db.Model):
    """Model to store unique performance records for each model tested."""
    __tablename__ = 'model_comparisons'

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)
    provider = db.Column(db.String(50), nullable=False)
    
    # Performance metrics
    overall_vulnerability_score = db.Column(db.Float, default=0.0)
    safeguard_success_rate = db.Column(db.Float, default=0.0)
    average_response_time = db.Column(db.Float, default=0.0)
    average_response_length = db.Column(db.Float, default=0.0)
    
    # Risk distribution
    risk_distribution_low = db.Column(db.Integer, default=0)
    risk_distribution_medium = db.Column(db.Integer, default=0)
    risk_distribution_high = db.Column(db.Integer, default=0)
    risk_distribution_critical = db.Column(db.Integer, default=0)
    
    # Category breakdown (JSON stored as text)
    category_breakdown = db.Column(db.Text)  # JSON string
    
    # Assessment metadata
    total_tests_run = db.Column(db.Integer, default=0)
    categories_tested = db.Column(db.Text)  # JSON array of categories
    
    # Advanced metrics
    bleu_score_factual = db.Column(db.Float)
    sentiment_bias_score = db.Column(db.Float)
    consistency_score = db.Column(db.Float)
    advanced_metrics_available = db.Column(db.Boolean, default=False)
    
    # Assessment summary
    strengths = db.Column(db.Text)  # JSON array
    weaknesses = db.Column(db.Text)  # JSON array
    potential_flaws = db.Column(db.Text)  # JSON array
    security_recommendation = db.Column(db.String(500))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign key to the most recent assessment
    latest_assessment_id = db.Column(db.Integer)
    
    # Unique constraint to ensure one record per model
    __table_args__ = (
        db.UniqueConstraint('model_name', 'provider', name='unique_model_provider'),
    )

    def to_dict(self):
        """Convert model comparison to dictionary."""
        import json
        
        return {
            'id': self.id,
            'model_name': self.model_name,
            'provider': self.provider,
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
            'total_tests_run': self.total_tests_run,
            'categories_tested': json.loads(self.categories_tested) if self.categories_tested else [],
            'bleu_score_factual': self.bleu_score_factual,
            'sentiment_bias_score': self.sentiment_bias_score,
            'consistency_score': self.consistency_score,
            'advanced_metrics_available': self.advanced_metrics_available,
            'strengths': json.loads(self.strengths) if self.strengths else [],
            'weaknesses': json.loads(self.weaknesses) if self.weaknesses else [],
            'potential_flaws': json.loads(self.potential_flaws) if self.potential_flaws else [],
            'security_recommendation': self.security_recommendation,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'latest_assessment_id': self.latest_assessment_id
        }

    @staticmethod
    def update_or_create(assessment_metrics, assessment_id):
        """Update existing record or create new one for this model."""
        import json
        
        # Extract model info
        model_name = assessment_metrics.get('model_name', 'Unknown')
        provider = assessment_metrics.get('provider', 'Unknown')
        
        # Find existing record
        existing = ModelComparison.query.filter_by(
            model_name=model_name,
            provider=provider
        ).first()
        
        # Prepare data
        risk_dist = assessment_metrics.get('risk_distribution', {})
        category_breakdown = assessment_metrics.get('category_breakdown', {})
        categories_tested = assessment_metrics.get('categories_tested', [])
        strengths = assessment_metrics.get('strengths', [])
        weaknesses = assessment_metrics.get('weaknesses', [])
        potential_flaws = assessment_metrics.get('potential_flaws', [])
        
        if existing:
            # Update existing record
            existing.overall_vulnerability_score = assessment_metrics.get('overall_vulnerability_score', 0.0)
            existing.safeguard_success_rate = assessment_metrics.get('safeguard_success_rate', 0.0)
            existing.average_response_time = assessment_metrics.get('average_response_time', 0.0)
            existing.average_response_length = assessment_metrics.get('average_response_length', 0.0)
            existing.risk_distribution_low = risk_dist.get('low', 0)
            existing.risk_distribution_medium = risk_dist.get('medium', 0)
            existing.risk_distribution_high = risk_dist.get('high', 0)
            existing.risk_distribution_critical = risk_dist.get('critical', 0)
            existing.category_breakdown = json.dumps(category_breakdown)
            existing.total_tests_run = assessment_metrics.get('total_tests_run', 0)
            existing.categories_tested = json.dumps(categories_tested)
            existing.bleu_score_factual = assessment_metrics.get('bleu_score_factual')
            existing.sentiment_bias_score = assessment_metrics.get('sentiment_bias_score')
            existing.consistency_score = assessment_metrics.get('consistency_score')
            existing.advanced_metrics_available = assessment_metrics.get('advanced_metrics_available', False)
            existing.strengths = json.dumps(strengths)
            existing.weaknesses = json.dumps(weaknesses)
            existing.potential_flaws = json.dumps(potential_flaws)
            existing.security_recommendation = assessment_metrics.get('security_recommendation', '')
            existing.latest_assessment_id = assessment_id
            existing.updated_at = datetime.utcnow()
            
            db.session.commit()
            return existing
        else:
            # Create new record
            new_comparison = ModelComparison(
                model_name=model_name,
                provider=provider,
                overall_vulnerability_score=assessment_metrics.get('overall_vulnerability_score', 0.0),
                safeguard_success_rate=assessment_metrics.get('safeguard_success_rate', 0.0),
                average_response_time=assessment_metrics.get('average_response_time', 0.0),
                average_response_length=assessment_metrics.get('average_response_length', 0.0),
                risk_distribution_low=risk_dist.get('low', 0),
                risk_distribution_medium=risk_dist.get('medium', 0),
                risk_distribution_high=risk_dist.get('high', 0),
                risk_distribution_critical=risk_dist.get('critical', 0),
                category_breakdown=json.dumps(category_breakdown),
                total_tests_run=assessment_metrics.get('total_tests_run', 0),
                categories_tested=json.dumps(categories_tested),
                bleu_score_factual=assessment_metrics.get('bleu_score_factual'),
                sentiment_bias_score=assessment_metrics.get('sentiment_bias_score'),
                consistency_score=assessment_metrics.get('consistency_score'),
                advanced_metrics_available=assessment_metrics.get('advanced_metrics_available', False),
                strengths=json.dumps(strengths),
                weaknesses=json.dumps(weaknesses),
                potential_flaws=json.dumps(potential_flaws),
                security_recommendation=assessment_metrics.get('security_recommendation', ''),
                latest_assessment_id=assessment_id
            )
            
            db.session.add(new_comparison)
            db.session.commit()
            return new_comparison

    @staticmethod
    def get_all_models():
        """Get all model comparison records."""
        return ModelComparison.query.order_by(ModelComparison.updated_at.desc()).all()
        
    @staticmethod
    def get_model_history(model_name, provider):
        """Get historical data for a specific model."""
        return ModelComparison.query.filter_by(
            model_name=model_name,
            provider=provider
        ).order_by(ModelComparison.updated_at.desc()).all()