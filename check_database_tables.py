#!/usr/bin/env python3
"""Simple database check using sqlite3 directly."""

import sqlite3
import os

def check_db():
    """Check database tables directly."""
    db_path = 'instance/redteam.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return
    
    try:
        print("🔍 Checking Database Tables...")
        print("=" * 40)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Tables found: {tables}")
        
        # Check ModelComparison table
        if 'model_comparisons' in tables:
            cursor.execute("SELECT COUNT(*) FROM model_comparisons")
            count = cursor.fetchone()[0]
            print(f"\n📊 ModelComparison: {count} records")
            
            if count > 0:
                cursor.execute("""
                    SELECT model_name, provider, overall_vulnerability_score, 
                           safeguard_success_rate, updated_at 
                    FROM model_comparisons 
                    ORDER BY updated_at DESC LIMIT 3
                """)
                records = cursor.fetchall()
                print("   Recent records:")
                for record in records:
                    model, provider, score, safeguard, updated = record
                    print(f"   • {model} ({provider}): Score {score:.1f}/10, Safeguard {safeguard:.1f}%")
        else:
            print("\n❌ model_comparisons table not found")
        
        # Check AssessmentHistory table  
        if 'assessment_history' in tables:
            cursor.execute("SELECT COUNT(*) FROM assessment_history")
            count = cursor.fetchone()[0]
            print(f"\n📈 AssessmentHistory: {count} records")
            
            if count > 0:
                cursor.execute("""
                    SELECT assessment_id, model_name, provider, 
                           overall_vulnerability_score, completed_at 
                    FROM assessment_history 
                    ORDER BY completed_at DESC LIMIT 3
                """)
                records = cursor.fetchall()
                print("   Recent records:")
                for record in records:
                    aid, model, provider, score, completed = record
                    print(f"   • Assessment {aid}: {model} ({provider}), Score {score:.1f}/10")
        else:
            print("\n❌ assessment_history table not found")
        
        # Check assessments table
        if 'assessments' in tables:
            cursor.execute("SELECT COUNT(*) FROM assessments")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM assessments WHERE status='completed'")
            completed = cursor.fetchone()[0]
            print(f"\n🎯 Assessments: {total} total, {completed} completed")
        
        conn.close()
        
        print("\n" + "=" * 40)
        if count == 0:
            print("💡 To populate tables: Run an assessment from the frontend")
        else:
            print("✅ Tables have data!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_db()
