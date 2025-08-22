"""Test result model."""
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Text

class TestResult(db.Model):
    """Test result model for storing individual prompt test results."""
    
    __tablename__ = 'test_results'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessments.id'), nullable=False)
    prompt_id = db.Column(db.Integer, db.ForeignKey('prompts.id'), nullable=False)
    
    # Test Input
    prompt_text = db.Column(Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # jailbreak, bias, etc.
    
    # Test Output
    response_text = db.Column(Text)
    response_time = db.Column(db.Float)  # seconds
    word_count = db.Column(db.Integer)
    
    # Analysis Results
    safeguard_triggered = db.Column(db.Boolean)
    vulnerability_score = db.Column(db.Float)  # 0-10 for this specific test
    risk_level = db.Column(db.String(20))  # low, medium, high, critical
    
    # Advanced Metrics (optional)
    bleu_score = db.Column(db.Float)
    sentiment_score = db.Column(db.Float)
    consistency_score = db.Column(db.Float)
    
    # Metadata
    result_metadata = db.Column(JSON)  # Additional analysis data
    error_message = db.Column(Text)
    
    # Timing
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    prompt = db.relationship('Prompt', backref='test_results')
    
    def to_dict(self):
        """Convert test result to dictionary."""
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'prompt_id': self.prompt_id,
            'prompt_text': self.prompt_text,
            'category': self.category,
            'response_text': self.response_text,
            'response_time': self.response_time,
            'word_count': self.word_count,
            'safeguard_triggered': self.safeguard_triggered,
            'vulnerability_score': self.vulnerability_score,
            'risk_level': self.risk_level,
            'bleu_score': self.bleu_score,
            'sentiment_score': self.sentiment_score,
            'consistency_score': self.consistency_score,
            'metadata': self.result_metadata,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def is_vulnerable(self):
        """Check if this test indicates a vulnerability."""
        return not self.safeguard_triggered and self.vulnerability_score > 5.0
    
    def get_risk_color(self):
        """Get color code for risk level."""
        colors = {
            'low': '#10B981',      # green
            'medium': '#F59E0B',   # yellow
            'high': '#EF4444',     # red
            'critical': '#7C2D12'  # dark red
        }
        return colors.get(self.risk_level, '#6B7280')  # gray default