#!/usr/bin/env python3
"""
Database Initialization Script
Creates initial database files and sample data for testing
"""

import json
import os
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sample_assessment_data():
    """Create sample historical assessment data."""
    sample_data = {
        'assessments': [
            {
                'id': 'assessment_1703548800_1234',
                'provider': 'openai',
                'model': 'gpt-3.5-turbo',
                'categories': 'jailbreak,bias',
                'temperature': 0.7,
                'status': 'completed',
                'created_at': '2024-01-15T10:30:00',
                'completed_at': '2024-01-15T10:35:00',
                'total_prompts': 10,
                'results_count': 10,
                'metrics': {
                    'safeguard_success_rate': 72.5,
                    'average_response_time': 2.1,
                    'average_response_length': 145,
                    'overall_vulnerability_score': 5.8,
                    'high_risk_findings': 3,
                    'total_tests': 10,
                    'strengths': [
                        'Strong safeguard performance with 72.5% success rate',
                        'Model demonstrates awareness of potentially harmful requests'
                    ],
                    'weaknesses': [
                        'Some subtle vulnerabilities in bias category',
                        'Response times could be optimized'
                    ],
                    'potential_flaws': [
                        'Risk of amplifying biases in sensitive applications'
                    ]
                }
            },
            {
                'id': 'assessment_1706227200_5678',
                'provider': 'openai',
                'model': 'gpt-3.5-turbo',
                'categories': 'jailbreak,bias,hallucination',
                'temperature': 0.7,
                'status': 'completed',
                'created_at': '2024-02-15T14:20:00',
                'completed_at': '2024-02-15T14:28:00',
                'total_prompts': 15,
                'results_count': 15,
                'metrics': {
                    'safeguard_success_rate': 78.2,
                    'average_response_time': 1.9,
                    'average_response_length': 152,
                    'overall_vulnerability_score': 5.2,
                    'high_risk_findings': 2,
                    'total_tests': 15,
                    'strengths': [
                        'Improved safeguard performance with 78.2% success rate',
                        'Better handling of hallucination attempts',
                        'Reduced average response time'
                    ],
                    'weaknesses': [
                        'Still some bias vulnerabilities present',
                        'Occasional false positives in jailbreak detection'
                    ],
                    'potential_flaws': [
                        'Consistency issues in multi-turn conversations'
                    ]
                }
            },
            {
                'id': 'assessment_1708905600_9012',
                'provider': 'anthropic',
                'model': 'claude-3-haiku-20240307',
                'categories': 'jailbreak,bias,privacy',
                'temperature': 0.7,
                'status': 'completed',
                'created_at': '2024-03-15T16:45:00',
                'completed_at': '2024-03-15T16:52:00',
                'total_prompts': 12,
                'results_count': 12,
                'metrics': {
                    'safeguard_success_rate': 85.3,
                    'average_response_time': 1.7,
                    'average_response_length': 168,
                    'overall_vulnerability_score': 4.1,
                    'high_risk_findings': 1,
                    'total_tests': 12,
                    'strengths': [
                        'Excellent safeguard performance with 85.3% success rate',
                        'Strong privacy protection mechanisms',
                        'Fast response times with quality answers'
                    ],
                    'weaknesses': [
                        'Minor bias detection in profession-related prompts'
                    ],
                    'potential_flaws': [
                        'Potential over-cautiousness in legitimate use cases'
                    ]
                }
            }
        ],
        'test_results': []
    }
    
    return sample_data

def create_sample_scheduled_assessments():
    """Create sample scheduled assessments."""
    now = datetime.now()
    
    sample_data = {
        'scheduled_assessments': [
            {
                'id': 'scheduled_1703548800_weekly',
                'name': 'Weekly Security Check',
                'provider': 'openai',
                'model': 'gpt-4',
                'categories': ['jailbreak', 'bias'],
                'schedule': 'weekly',
                'is_active': True,
                'created_at': (now - timedelta(days=30)).isoformat(),
                'last_run': (now - timedelta(days=7)).isoformat(),
                'next_run': (now + timedelta(days=7)).isoformat(),
                'run_count': 4,
                'api_key_provider': 'openai'
            },
            {
                'id': 'scheduled_1703548801_monthly',
                'name': 'Monthly Comprehensive Audit',
                'provider': 'anthropic',
                'model': 'claude-3-sonnet-20241022',
                'categories': ['jailbreak', 'bias', 'hallucination', 'privacy', 'manipulation'],
                'schedule': 'monthly',
                'is_active': True,
                'created_at': (now - timedelta(days=15)).isoformat(),
                'last_run': None,
                'next_run': (now + timedelta(days=15)).isoformat(),
                'run_count': 0,
                'api_key_provider': 'anthropic'
            }
        ]
    }
    
    return sample_data

def initialize_database():
    """Initialize database files with sample data."""
    print("🗄️  Initializing LLM Red Team Platform Database")
    print("=" * 50)
    
    # Create assessment database
    assessment_file = 'assessment_database.json'
    if not os.path.exists(assessment_file):
        sample_assessments = create_sample_assessment_data()
        
        with open(assessment_file, 'w') as f:
            json.dump(sample_assessments, f, indent=2)
        
        print(f"✅ Created {assessment_file} with {len(sample_assessments['assessments'])} sample assessments")
    else:
        print(f"📁 {assessment_file} already exists")
    
    # Create scheduled assessments database
    scheduled_file = 'scheduled_assessments.json'
    if not os.path.exists(scheduled_file):
        sample_scheduled = create_sample_scheduled_assessments()
        
        with open(scheduled_file, 'w') as f:
            json.dump(sample_scheduled, f, indent=2)
        
        print(f"✅ Created {scheduled_file} with {len(sample_scheduled['scheduled_assessments'])} sample schedules")
    else:
        print(f"📁 {scheduled_file} already exists")
    
    print("\n🎯 Database Initialization Complete!")
    print("""
💡 What's Available Now:
   ✅ Historical assessment data for trends
   ✅ Scheduled assessment management  
   ✅ Persistent storage for all results
   ✅ Real-time data collection
   ✅ API endpoints for data access

🚀 Ready for full testing with persistent storage!
    """)

if __name__ == "__main__":
    initialize_database()