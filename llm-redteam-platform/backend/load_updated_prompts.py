#!/usr/bin/env python3
"""
Load updated red team prompts from JSON files into the database.
"""

import json
import os
from app import create_app, db
from app.models import Prompt

def load_prompts_from_json(file_path):
    """Load prompts from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            prompts_data = json.load(f)
        return prompts_data
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"JSON decode error in {file_path}: {e}")
        return []

def clear_existing_prompts():
    """Clear all existing prompts from database."""
    try:
        db.session.query(Prompt).delete()
        db.session.commit()
        print("✅ Cleared existing prompts")
    except Exception as e:
        print(f"❌ Error clearing prompts: {e}")
        db.session.rollback()

def load_prompt_category(category, file_path):
    """Load prompts for a specific category."""
    print(f"\n📂 Loading {category} prompts from {file_path}")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return 0
    
    prompts_data = load_prompts_from_json(file_path)
    if not prompts_data:
        return 0
    
    loaded_count = 0
    for prompt_data in prompts_data:
        try:
            prompt = Prompt(
                category=prompt_data.get('category', category),
                text=prompt_data.get('text', ''),
                source_cookbook=prompt_data.get('source_cookbook', 'Custom Red Team Dataset'),
                difficulty_level=prompt_data.get('difficulty_level', 'medium'),
                expected_outcome=prompt_data.get('expected_outcome', 'blocked'),
                description=prompt_data.get('description', ''),
                tags=prompt_data.get('tags', []),
                base_vulnerability_score=prompt_data.get('base_vulnerability_score', 5.0)
            )
            
            db.session.add(prompt)
            loaded_count += 1
            
        except Exception as e:
            print(f"❌ Error loading prompt {prompt_data.get('id', 'unknown')}: {e}")
    
    try:
        db.session.commit()
        print(f"✅ Loaded {loaded_count} {category} prompts")
        return loaded_count
    except Exception as e:
        print(f"❌ Error committing {category} prompts: {e}")
        db.session.rollback()
        return 0

def main():
    """Main function to load all updated prompts."""
    app = create_app()
    
    with app.app_context():
        print("🚀 Loading Updated Red Team Prompts")
        print("=" * 50)
        
        # Clear existing prompts
        clear_existing_prompts()
        
        # Define categories and their file paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Go up one level from backend
        categories = {
            'jailbreak': os.path.join(base_dir, 'data/red_team_prompts/jailbreak_updated.json'),
            'bias': os.path.join(base_dir, 'data/red_team_prompts/bias_updated.json'),
            'hallucination': os.path.join(base_dir, 'data/red_team_prompts/hallucination_updated.json'),
            'privacy': os.path.join(base_dir, 'data/red_team_prompts/privacy_updated.json'),
            'manipulation': os.path.join(base_dir, 'data/red_team_prompts/manipulation_updated.json')
        }
        
        total_loaded = 0
        
        # Load each category
        for category, file_path in categories.items():
            count = load_prompt_category(category, file_path)
            total_loaded += count
        
        print("\n📊 Summary")
        print("=" * 30)
        print(f"Total prompts loaded: {total_loaded}")
        
        # Verify database content
        print("\n🔍 Database Verification")
        for category in categories.keys():
            count = Prompt.query.filter_by(category=category).count()
            print(f"  {category}: {count} prompts")
        
        print(f"\nTotal in database: {Prompt.query.count()}")
        print("\n✅ Prompt loading completed!")

if __name__ == "__main__":
    main()
