#!/usr/bin/env python3
"""
Scheduled Assessment Manager
Handles persistent storage and execution of scheduled red team assessments
"""

import json
import os
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ScheduledAssessmentManager:
    """Manages scheduled assessments with persistent storage."""
    
    def __init__(self, storage_file: str = 'scheduled_assessments.json'):
        self.storage_file = storage_file
        self.running = False
        self.scheduler_thread = None
    
    def create_scheduled_assessment(self, assessment_data: Dict[str, Any]) -> str:
        """Create a new scheduled assessment."""
        assessment_id = f"scheduled_{int(time.time())}_{hash(assessment_data['name']) % 10000}"
        
        scheduled_assessment = {
            'id': assessment_id,
            'name': assessment_data['name'],
            'provider': assessment_data['provider'],
            'model': assessment_data['model'],
            'categories': assessment_data['categories'],
            'schedule': assessment_data['schedule'],  # 'daily', 'weekly', 'monthly'
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'last_run': None,
            'next_run': self._calculate_next_run(assessment_data['schedule']),
            'run_count': 0,
            'api_key_provider': assessment_data.get('api_key_provider', assessment_data['provider'])
        }
        
        # Save to storage
        self._save_scheduled_assessment(scheduled_assessment)
        
        logger.info(f"Created scheduled assessment: {assessment_id}")
        return assessment_id
    
    def get_all_scheduled_assessments(self) -> List[Dict[str, Any]]:
        """Get all scheduled assessments."""
        try:
            if not os.path.exists(self.storage_file):
                return []
            
            with open(self.storage_file, 'r') as f:
                data = json.load(f)
            
            return data.get('scheduled_assessments', [])
        
        except Exception as e:
            logger.error(f"Failed to get scheduled assessments: {e}")
            return []
    
    def update_scheduled_assessment(self, assessment_id: str, updates: Dict[str, Any]) -> bool:
        """Update a scheduled assessment."""
        try:
            assessments = self.get_all_scheduled_assessments()
            
            for i, assessment in enumerate(assessments):
                if assessment['id'] == assessment_id:
                    assessments[i].update(updates)
                    assessments[i]['updated_at'] = datetime.now().isoformat()
                    
                    # Save updated list
                    self._save_all_assessments(assessments)
                    return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to update scheduled assessment: {e}")
            return False
    
    def delete_scheduled_assessment(self, assessment_id: str) -> bool:
        """Delete a scheduled assessment."""
        try:
            assessments = self.get_all_scheduled_assessments()
            original_count = len(assessments)
            
            assessments = [a for a in assessments if a['id'] != assessment_id]
            
            if len(assessments) < original_count:
                self._save_all_assessments(assessments)
                logger.info(f"Deleted scheduled assessment: {assessment_id}")
                return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to delete scheduled assessment: {e}")
            return False
    
    def toggle_assessment_status(self, assessment_id: str) -> bool:
        """Toggle active status of a scheduled assessment."""
        try:
            assessments = self.get_all_scheduled_assessments()
            
            for assessment in assessments:
                if assessment['id'] == assessment_id:
                    assessment['is_active'] = not assessment['is_active']
                    assessment['updated_at'] = datetime.now().isoformat()
                    
                    self._save_all_assessments(assessments)
                    logger.info(f"Toggled assessment {assessment_id} to {'active' if assessment['is_active'] else 'inactive'}")
                    return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to toggle assessment status: {e}")
            return False
    
    def start_scheduler(self):
        """Start the background scheduler."""
        if self.running:
            return
        
        self.running = True
        self.scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self.scheduler_thread.start()
        logger.info("Scheduled assessment scheduler started")
    
    def stop_scheduler(self):
        """Stop the background scheduler."""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Scheduled assessment scheduler stopped")
    
    def run_scheduled_assessment_now(self, assessment_id: str) -> bool:
        """Run a scheduled assessment immediately."""
        try:
            assessments = self.get_all_scheduled_assessments()
            
            for assessment in assessments:
                if assessment['id'] == assessment_id:
                    # Update last run and next run
                    assessment['last_run'] = datetime.now().isoformat()
                    assessment['next_run'] = self._calculate_next_run(assessment['schedule'])
                    assessment['run_count'] += 1
                    
                    self._save_all_assessments(assessments)
                    
                    # Execute the assessment
                    self._execute_assessment(assessment)
                    return True
            
            return False
        
        except Exception as e:
            logger.error(f"Failed to run scheduled assessment: {e}")
            return False
    
    def _scheduler_loop(self):
        """Main scheduler loop that runs in background."""
        while self.running:
            try:
                now = datetime.now()
                assessments = self.get_all_scheduled_assessments()
                
                for assessment in assessments:
                    if not assessment['is_active']:
                        continue
                    
                    next_run = datetime.fromisoformat(assessment['next_run'])
                    
                    if now >= next_run:
                        logger.info(f"Running scheduled assessment: {assessment['name']}")
                        
                        # Update scheduling info
                        assessment['last_run'] = now.isoformat()
                        assessment['next_run'] = self._calculate_next_run(assessment['schedule'])
                        assessment['run_count'] += 1
                        
                        self._save_all_assessments(assessments)
                        
                        # Execute assessment in background
                        threading.Thread(
                            target=self._execute_assessment, 
                            args=(assessment,), 
                            daemon=True
                        ).start()
                
                # Check every minute
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                time.sleep(60)
    
    def _execute_assessment(self, assessment: Dict[str, Any]):
        """Execute a scheduled assessment."""
        try:
            from red_team_engine import RedTeamEngine, AssessmentConfig
            
            # Get API key from environment
            api_key_env_map = {
                'openai': 'OPENAI_API_KEY',
                'anthropic': 'ANTHROPIC_API_KEY',
                'google': 'GOOGLE_API_KEY'
            }
            
            env_key = api_key_env_map.get(assessment['api_key_provider'])
            api_key = os.getenv(env_key) if env_key else None
            
            if not api_key:
                logger.error(f"No API key found for provider: {assessment['api_key_provider']}")
                return
            
            # Create assessment configuration
            config = {
                'provider': assessment['provider'],
                'model': assessment['model'],
                'api_key': api_key,
                'categories': assessment['categories'],
                'temperature': 0.7
            }
            
            # Run assessment
            engine = RedTeamEngine(config)
            results = engine.run_assessment()
            
            logger.info(f"Scheduled assessment completed: {assessment['name']} ({len(results)} tests)")
            
        except Exception as e:
            logger.error(f"Failed to execute scheduled assessment: {e}")
    
    def _calculate_next_run(self, schedule: str) -> str:
        """Calculate next run time based on schedule."""
        now = datetime.now()
        
        if schedule == 'daily':
            next_run = now + timedelta(days=1)
        elif schedule == 'weekly':
            next_run = now + timedelta(weeks=1)
        elif schedule == 'monthly':
            # Approximate monthly as 30 days
            next_run = now + timedelta(days=30)
        else:
            # Default to daily
            next_run = now + timedelta(days=1)
        
        return next_run.isoformat()
    
    def _save_scheduled_assessment(self, assessment: Dict[str, Any]):
        """Save a single scheduled assessment."""
        assessments = self.get_all_scheduled_assessments()
        assessments.append(assessment)
        self._save_all_assessments(assessments)
    
    def _save_all_assessments(self, assessments: List[Dict[str, Any]]):
        """Save all scheduled assessments to storage."""
        try:
            data = {'scheduled_assessments': assessments}
            
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
        
        except Exception as e:
            logger.error(f"Failed to save scheduled assessments: {e}")

# Global instance
scheduler_manager = ScheduledAssessmentManager()

if __name__ == "__main__":
    # Demo usage
    manager = ScheduledAssessmentManager()
    
    # Create a demo scheduled assessment
    demo_assessment = {
        'name': 'Daily Security Check',
        'provider': 'openai',
        'model': 'gpt-3.5-turbo',
        'categories': ['jailbreak', 'bias'],
        'schedule': 'daily'
    }
    
    assessment_id = manager.create_scheduled_assessment(demo_assessment)
    print(f"Created scheduled assessment: {assessment_id}")
    
    # List all assessments
    assessments = manager.get_all_scheduled_assessments()
    print(f"Total scheduled assessments: {len(assessments)}")
    
    # Start scheduler
    manager.start_scheduler()
    print("Scheduler started - press Ctrl+C to stop")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        manager.stop_scheduler()
        print("Scheduler stopped")