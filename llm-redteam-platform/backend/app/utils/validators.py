"""Input validation utilities."""
import re
from typing import Dict, List, Any

# Supported LLM providers and models (updated with working models)
SUPPORTED_PROVIDERS = {
    'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    'anthropic': ['claude-3-haiku-20240307'],  # Working model only
    'google': ['gemini-1.5-flash']  # Updated to working model
}

SUPPORTED_CATEGORIES = [
    'jailbreak', 'bias', 'hallucination', 'privacy', 'manipulation'
]

def validate_assessment_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate assessment creation data."""
    errors = []
    
    # Required fields
    required_fields = ['name', 'llm_provider', 'model_name', 'test_categories']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"Missing required field: {field}")
    
    if errors:
        return {'valid': False, 'message': '; '.join(errors)}
    
    # Validate name
    if len(data['name']) < 3 or len(data['name']) > 200:
        errors.append("Assessment name must be between 3 and 200 characters")
    
    # Validate LLM provider
    if data['llm_provider'] not in SUPPORTED_PROVIDERS:
        errors.append(f"Unsupported LLM provider: {data['llm_provider']}")
    
    # Validate model name
    if data['llm_provider'] in SUPPORTED_PROVIDERS:
        supported_models = SUPPORTED_PROVIDERS[data['llm_provider']]
        if data['model_name'] not in supported_models:
            errors.append(f"Unsupported model for {data['llm_provider']}: {data['model_name']}")
    
    # Validate test categories
    if not isinstance(data['test_categories'], list):
        errors.append("test_categories must be a list")
    else:
        for category in data['test_categories']:
            if category not in SUPPORTED_CATEGORIES:
                errors.append(f"Unsupported test category: {category}")
    
    # Validate description length if provided
    if 'description' in data and data['description']:
        if len(data['description']) > 1000:
            errors.append("Description must be less than 1000 characters")
    
    if errors:
        return {'valid': False, 'message': '; '.join(errors)}
    
    return {'valid': True, 'message': 'Validation passed'}

def validate_prompt_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate prompt creation data."""
    errors = []
    
    # Required fields
    required_fields = ['category', 'text', 'source_cookbook']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"Missing required field: {field}")
    
    if errors:
        return {'valid': False, 'message': '; '.join(errors)}
    
    # Validate category
    if data['category'] not in SUPPORTED_CATEGORIES:
        errors.append(f"Unsupported category: {data['category']}")
    
    # Validate prompt text
    if len(data['text']) < 10:
        errors.append("Prompt text must be at least 10 characters")
    elif len(data['text']) > 5000:
        errors.append("Prompt text must be less than 5000 characters")
    
    # Validate difficulty level if provided
    if 'difficulty_level' in data:
        valid_levels = ['easy', 'medium', 'hard']
        if data['difficulty_level'] not in valid_levels:
            errors.append(f"Invalid difficulty level: {data['difficulty_level']}")
    
    # Validate expected outcome if provided
    if 'expected_outcome' in data:
        valid_outcomes = ['blocked', 'flagged', 'passed']
        if data['expected_outcome'] not in valid_outcomes:
            errors.append(f"Invalid expected outcome: {data['expected_outcome']}")
    
    # Validate vulnerability score if provided
    if 'base_vulnerability_score' in data:
        score = data['base_vulnerability_score']
        if not isinstance(score, (int, float)) or score < 0 or score > 10:
            errors.append("base_vulnerability_score must be between 0 and 10")
    
    if errors:
        return {'valid': False, 'message': '; '.join(errors)}
    
    return {'valid': True, 'message': 'Validation passed'}

def validate_api_key(provider: str, api_key: str) -> Dict[str, Any]:
    """Validate API key format for different providers."""
    if not api_key:
        return {'valid': False, 'message': 'API key is required'}
    
    # Basic format validation
    if provider == 'openai':
        if not api_key.startswith('sk-'):
            return {'valid': False, 'message': 'OpenAI API key must start with sk-'}
        if len(api_key) < 20:
            return {'valid': False, 'message': 'OpenAI API key appears too short'}
    
    elif provider == 'anthropic':
        if not api_key.startswith('sk-ant-'):
            return {'valid': False, 'message': 'Anthropic API key must start with sk-ant-'}
    
    elif provider == 'google':
        if len(api_key) < 10:
            return {'valid': False, 'message': 'Google API key appears too short'}
    
    return {'valid': True, 'message': 'API key format valid'}

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent injection attacks."""
    if not isinstance(text, str):
        return str(text)
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', text)
    
    # Limit length
    return sanitized[:10000]

def validate_comparison_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate assessment comparison request."""
    errors = []
    
    if 'assessment_ids' not in data:
        errors.append("Missing assessment_ids field")
        return {'valid': False, 'message': '; '.join(errors)}
    
    assessment_ids = data['assessment_ids']
    
    if not isinstance(assessment_ids, list):
        errors.append("assessment_ids must be a list")
    elif len(assessment_ids) < 2:
        errors.append("At least 2 assessment IDs required for comparison")
    elif len(assessment_ids) > 10:
        errors.append("Maximum 10 assessments can be compared at once")
    else:
        # Validate each ID is an integer
        for aid in assessment_ids:
            if not isinstance(aid, int) or aid <= 0:
                errors.append(f"Invalid assessment ID: {aid}")
    
    if errors:
        return {'valid': False, 'message': '; '.join(errors)}
    
    return {'valid': True, 'message': 'Validation passed'}