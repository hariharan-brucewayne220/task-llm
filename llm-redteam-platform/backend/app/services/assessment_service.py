"""Assessment service using queue-based execution."""
import logging
from datetime import datetime
from typing import Dict, Optional
from app import db
from app.models import Assessment, Prompt
from app.services.assessment_queue import AssessmentQueue
from app.websocket.events import send_assessment_update

logger = logging.getLogger(__name__)

class AssessmentService:
    """Service for managing queue-based red team assessment execution."""
    
    @classmethod
    def start_assessment(cls, assessment_id: int, api_key: str) -> bool:
        """Start a new assessment using queue-based processing."""
        try:
            assessment = Assessment.query.get(assessment_id)
            if not assessment:
                logger.error(f"Assessment {assessment_id} not found")
                return False
                
            logger.info(f"Starting queue-based assessment execution: {assessment_id}")
            
            # Validate API key
            if not api_key:
                error_msg = f"API key required for provider: {assessment.llm_provider}"
                logger.error(error_msg)
                assessment.status = 'failed'
                assessment.error_message = error_msg
                db.session.commit()
                return False
            
            # Get prompts for test categories
            prompts_per_category = max(1, assessment.total_prompts // len(assessment.test_categories))
            all_prompts = Prompt.get_random_by_categories(
                assessment.test_categories, 
                prompts_per_category
            )
            
            if not all_prompts:
                error_msg = "No prompts found for the selected categories"
                logger.error(error_msg)
                assessment.status = 'failed'
                assessment.error_message = error_msg
                db.session.commit()
                return False
            
            # Create assessment queue
            queue_created = AssessmentQueue.create_queue(assessment_id, all_prompts, api_key)
            if not queue_created:
                error_msg = "Failed to create assessment queue"
                logger.error(error_msg)
                assessment.status = 'failed'
                assessment.error_message = error_msg
                db.session.commit()
                return False
            
            # Update assessment status
            assessment.status = 'running'
            assessment.started_at = datetime.utcnow()
            assessment.total_prompts = len(all_prompts)
            db.session.commit()
            
            # Send assessment started event
            send_assessment_update(assessment_id, 'assessment_started', {
                'assessment_id': assessment_id,
                'total_prompts': len(all_prompts),
                'categories': assessment.test_categories,
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Start queue processing using SocketIO background task (like old service)
            from app import socketio
            from flask import current_app
            socketio.start_background_task(AssessmentQueue._process_queue, assessment_id, current_app._get_current_object())
            
            # Mark queue as running
            queue_created = AssessmentQueue._set_queue_running(assessment_id)
            if not queue_created:
                error_msg = "Failed to mark queue as running"
                logger.error(error_msg)
                assessment.status = 'failed'
                assessment.error_message = error_msg
                db.session.commit()
                return False
            
            logger.info(f"Assessment {assessment_id} started successfully with {len(all_prompts)} prompts")
            return True
            
        except Exception as e:
            logger.error(f"Error starting assessment {assessment_id}: {str(e)}")
            
            # Mark assessment as failed
            try:
                assessment = Assessment.query.get(assessment_id)
                if assessment:
                    assessment.status = 'failed'
                    assessment.error_message = str(e)
                    db.session.commit()
            except Exception as db_error:
                logger.error(f"Failed to update assessment status: {str(db_error)}")
            
            return False
    
    @classmethod
    def pause_assessment(cls, assessment_id: int) -> bool:
        """Pause a running assessment."""
        try:
            success = AssessmentQueue.pause_processing(assessment_id)
            if success:
                logger.info(f"Assessment {assessment_id} paused successfully")
                return True
            else:
                logger.error(f"Failed to pause assessment {assessment_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error pausing assessment {assessment_id}: {str(e)}")
            return False
    
    @classmethod
    def resume_assessment(cls, assessment_id: int) -> bool:
        """Resume a paused assessment."""
        try:
            success = AssessmentQueue.resume_processing(assessment_id)
            if success:
                logger.info(f"Assessment {assessment_id} resumed successfully")
                return True
            else:
                logger.error(f"Failed to resume assessment {assessment_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error resuming assessment {assessment_id}: {str(e)}")
            return False
    
    @classmethod
    def stop_assessment(cls, assessment_id: int) -> bool:
        """Stop a running assessment."""
        try:
            # Stop queue processing
            success = AssessmentQueue.stop_processing(assessment_id)
            
            # Update database status
            assessment = Assessment.query.get(assessment_id)
            if assessment:
                assessment.status = 'stopped'
                
                # Get queue status for final counts
                queue_status = AssessmentQueue.get_queue_status(assessment_id)
                if queue_status:
                    assessment.completed_prompts = queue_status['completed_prompts']
                
                db.session.commit()
            
            if success:
                logger.info(f"Assessment {assessment_id} stopped successfully")
                return True
            else:
                logger.error(f"Failed to stop assessment {assessment_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error stopping assessment {assessment_id}: {str(e)}")
            return False
    
    @classmethod
    def clear_assessment(cls, assessment_id: int) -> bool:
        """Clear assessment queue completely."""
        try:
            success = AssessmentQueue.clear_queue(assessment_id)
            
            if success:
                logger.info(f"Assessment {assessment_id} queue cleared successfully")
                return True
            else:
                logger.error(f"Failed to clear assessment {assessment_id} queue")
                return False
                
        except Exception as e:
            logger.error(f"Error clearing assessment {assessment_id}: {str(e)}")
            return False
    
    @classmethod
    def get_assessment_status(cls, assessment_id: int) -> Optional[Dict]:
        """Get detailed assessment status including queue information."""
        try:
            # Get database status
            assessment = Assessment.query.get(assessment_id)
            if not assessment:
                return None
            
            # Get queue status
            queue_status = AssessmentQueue.get_queue_status(assessment_id)
            
            status = {
                'assessment_id': assessment_id,
                'database_status': assessment.status,
                'queue_status': queue_status['status'] if queue_status else 'not_found',
                'total_prompts': assessment.total_prompts,
                'completed_prompts': queue_status['completed_prompts'] if queue_status else assessment.completed_prompts or 0,
                'progress_percentage': queue_status['progress_percentage'] if queue_status else 0,
                'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
                'started_at': assessment.started_at.isoformat() if assessment.started_at else None,
                'completed_at': assessment.completed_at.isoformat() if assessment.completed_at else None,
                'error_message': assessment.error_message,
                'categories': assessment.test_categories,
                'provider': assessment.llm_provider,
                'model': assessment.model_name
            }
            
            if queue_status:
                status.update({
                    'remaining_prompts': queue_status['remaining_prompts'],
                    'queue_error': queue_status['error']
                })
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting assessment status for {assessment_id}: {str(e)}")
            return None
    
    @classmethod
    def cleanup_client_assessments(cls, client_id: str):
        """Clean up assessments for a disconnected client."""
        try:
            # This would need client tracking - for now just log
            logger.info(f"Client {client_id} disconnected - cleanup requested")
            
            # In a full implementation, you'd track which assessments belong to which clients
            # and clean up accordingly
            
        except Exception as e:
            logger.error(f"Error cleaning up assessments for client {client_id}: {str(e)}")
    
    @classmethod
    def get_active_assessment_count(cls) -> int:
        """Get number of currently active assessments."""
        try:
            return AssessmentQueue.get_active_queue_count()
        except Exception as e:
            logger.error(f"Error getting active assessment count: {str(e)}")
            return 0
    
    @classmethod
    def emergency_cleanup(cls):
        """Perform emergency cleanup of all assessments."""
        try:
            logger.warning("Performing emergency assessment cleanup")
            AssessmentQueue.emergency_cleanup()
            logger.info("Emergency assessment cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during emergency cleanup: {str(e)}")
    
    @classmethod  
    def health_check(cls) -> Dict:
        """Get system health status."""
        try:
            active_queues = AssessmentQueue.get_active_queue_count()
            max_queues = AssessmentQueue.MAX_CONCURRENT_QUEUES
            
            health_status = "healthy"
            if active_queues >= max_queues * 0.8:
                health_status = "warning"
            if active_queues >= max_queues:
                health_status = "critical"
            
            return {
                'status': health_status,
                'active_assessments': active_queues,
                'max_concurrent': max_queues,
                'utilization_percentage': (active_queues / max_queues) * 100,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting health status: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    # Backward compatibility methods for existing API endpoints
    @classmethod
    def run_assessment_async(cls, assessment_id: int, api_key: str = None):
        """Backward compatibility method for old API endpoints."""
        logger.info(f"Using backward compatibility run_assessment_async for assessment {assessment_id}")
        return cls.start_assessment(assessment_id, api_key)
    
    @classmethod
    def get_assessment_state(cls, assessment_id: int):
        """Backward compatibility method for old API endpoints."""
        logger.info(f"Using backward compatibility get_assessment_state for assessment {assessment_id}")
        status_info = cls.get_assessment_status(assessment_id)
        if not status_info:
            return 'not_found'
        
        # Map queue status to old state format
        queue_status = status_info['queue_status']
        if queue_status == 'running':
            return 'running'
        elif queue_status == 'paused':
            return 'paused'
        elif queue_status in ['stopped', 'completed']:
            return 'stopped'
        else:
            return status_info['database_status']
    
    @classmethod
    def debug_assessment_state(cls, assessment_id: int):
        """Backward compatibility method for debugging assessment state."""
        logger.info(f"Using backward compatibility debug_assessment_state for assessment {assessment_id}")
        status_info = cls.get_assessment_status(assessment_id)
        if not status_info:
            return {
                'memory_state': 'Not in memory',
                'is_paused': False,
                'db_state': 'Not in database',
                'assessment_exists': False
            }
        
        return {
            'memory_state': status_info['queue_status'],
            'is_paused': status_info['queue_status'] == 'paused',
            'db_state': status_info['database_status'],
            'assessment_exists': status_info['assessment_id'] is not None
        }