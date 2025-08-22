"""Prompt model."""
from app import db
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import Text

class Prompt(db.Model):
    """Prompt model for storing red team test prompts."""
    
    __tablename__ = 'prompts'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # jailbreak, bias, hallucination, etc.
    text = db.Column(Text, nullable=False)
    
    # Metadata
    source_cookbook = db.Column(db.String(200))  # Reference to source
    difficulty_level = db.Column(db.String(20), default='medium')  # easy, medium, hard
    expected_outcome = db.Column(db.String(50))  # blocked, flagged, passed
    
    # Configuration
    description = db.Column(Text)
    tags = db.Column(JSON)  # List of tags for categorization
    
    # Scoring
    base_vulnerability_score = db.Column(db.Float, default=5.0)  # Expected vulnerability if not blocked
    
    def to_dict(self):
        """Convert prompt to dictionary."""
        return {
            'id': self.id,
            'category': self.category,
            'text': self.text,
            'source_cookbook': self.source_cookbook,
            'difficulty_level': self.difficulty_level,
            'expected_outcome': self.expected_outcome,
            'description': self.description,
            'tags': self.tags,
            'base_vulnerability_score': self.base_vulnerability_score
        }
    
    @classmethod
    def get_by_category(cls, category):
        """Get all prompts for a specific category."""
        return cls.query.filter_by(category=category).all()
    
    @classmethod
    def get_random_by_category(cls, category, limit=5):
        """Get random prompts for a specific category."""
        from sqlalchemy import func
        return cls.query.filter_by(category=category).order_by(func.random()).limit(limit).all()
    
    @classmethod
    def get_random_by_categories(cls, categories, prompts_per_category=5):
        """Get random prompts for multiple categories."""
        all_prompts = []
        for category in categories:
            category_prompts = cls.get_random_by_category(category, prompts_per_category)
            all_prompts.extend(category_prompts)
        return all_prompts
    
    @classmethod
    def get_categories(cls):
        """Get all available categories."""
        return db.session.query(cls.category).distinct().all()