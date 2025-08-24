#!/usr/bin/env python3
"""
Example script to generate assessment report
Usage: python generate_report_example.py
"""

import os
import sys
from generate_assessment_report import AssessmentReportGenerator

def main():
    # Get the most recent assessment ID from the database
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from app import create_app, db
    from app.models import Assessment
    
    app = create_app()
    
    with app.app_context():
        # Get the most recent completed assessment
        recent_assessment = Assessment.query.filter_by(status='completed').order_by(Assessment.created_at.desc()).first()
        
        if not recent_assessment:
            print("No completed assessments found!")
            print("Please run an assessment first using the dashboard.")
            return
        
        print(f"Found assessment: ID={recent_assessment.id}, Model={recent_assessment.model_name}")
        print(f"Created: {recent_assessment.created_at}")
        print(f"Categories tested: {', '.join(recent_assessment.test_categories)}")
        print()
        
        # Generate report
        generator = AssessmentReportGenerator(recent_assessment.id)
        output_file = generator.generate_report()
        
        print(f"\nReport successfully generated: {output_file}")
        print(f"Full path: {os.path.abspath(output_file)}")

if __name__ == '__main__':
    main()