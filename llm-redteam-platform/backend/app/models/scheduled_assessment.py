"""Scheduled Assessment model for managing recurring assessments."""
from datetime import datetime, timedelta
from app import db
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Text
import json

class ScheduledAssessment(db.Model):
    """Model for storing scheduled assessment configurations."""
    
    __tablename__ = 'scheduled_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(Text)
    
    # LLM Configuration
    provider = db.Column(db.String(50), nullable=False)  # openai, anthropic, google
    model = db.Column(db.String(100), nullable=False)   # gpt-4, claude-3-sonnet, etc.
    
    # Test Configuration
    categories = db.Column(JSON)  # ['jailbreak', 'bias', 'hallucination']
    
    # Scheduling Configuration
    schedule = db.Column(db.String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    next_run = db.Column(db.DateTime, nullable=False)
    last_run = db.Column(db.DateTime)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert scheduled assessment to dictionary."""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'provider': self.provider,
            'model': self.model,
            'categories': self.categories if self.categories else [],
            'schedule': self.schedule,
            'nextRun': self.next_run.isoformat() if self.next_run else None,
            'lastRun': self.last_run.isoformat() if self.last_run else None,
            'isActive': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_next_run(self):
        """Calculate the next run time based on schedule."""
        now = datetime.utcnow()
        
        if self.schedule == 'daily':
            self.next_run = now + timedelta(days=1)
        elif self.schedule == 'weekly':
            self.next_run = now + timedelta(weeks=1)
        elif self.schedule == 'monthly':
            # Approximate monthly as 30 days
            self.next_run = now + timedelta(days=30)
        else:
            # Default to weekly
            self.next_run = now + timedelta(weeks=1)
    
    @classmethod
    def get_all_active(cls):
        """Get all active scheduled assessments."""
        return cls.query.filter_by(is_active=True).order_by(cls.next_run.asc()).all()
    
    @classmethod
    def get_due_assessments(cls):
        """Get assessments that are due to run."""
        now = datetime.utcnow()
        return cls.query.filter(
            cls.is_active == True,
            cls.next_run <= now
        ).all()

