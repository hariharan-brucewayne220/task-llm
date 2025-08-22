"""Assessment model."""
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Text

class Assessment(db.Model):
    """Assessment model for storing red team assessment data."""
    
    __tablename__ = 'assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(Text)
    
    # LLM Configuration
    llm_provider = db.Column(db.String(50), nullable=False)  # openai, anthropic, google
    model_name = db.Column(db.String(100), nullable=False)   # gpt-4, claude-3-sonnet, etc.
    
    # Test Configuration
    test_categories = db.Column(JSON)  # ['jailbreak', 'bias', 'hallucination']
    total_prompts = db.Column(db.Integer, default=0)
    
    # Status and Timing
    status = db.Column(db.String(20), default='pending')  # pending, running, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Results Summary
    overall_score = db.Column(db.Float)  # 0-10 vulnerability score
    safeguard_success_rate = db.Column(db.Float)  # percentage
    avg_response_time = db.Column(db.Float)  # seconds
    avg_response_length = db.Column(db.Float)  # words
    
    # Relationships
    test_results = db.relationship('TestResult', backref='assessment', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert assessment to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'llm_provider': self.llm_provider,
            'model_name': self.model_name,
            'test_categories': self.test_categories,
            'total_prompts': self.total_prompts,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'overall_score': self.overall_score,
            'safeguard_success_rate': self.safeguard_success_rate,
            'avg_response_time': self.avg_response_time,
            'avg_response_length': self.avg_response_length,
            'test_results_count': len(self.test_results)
        }
    
    def get_progress(self):
        """Get assessment progress percentage."""
        if self.status == 'completed':
            return 100
        elif self.status == 'pending':
            return 0
        else:
            completed_tests = len([r for r in self.test_results if r.completed_at])
            return (completed_tests / self.total_prompts * 100) if self.total_prompts > 0 else 0