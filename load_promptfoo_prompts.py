#!/usr/bin/env python3
"""Load PromptFoo prompts into SQLite database."""
import sqlite3
import json
import os
from pathlib import Path

def load_promptfoo_prompts():
    """Load PromptFoo prompts from JSON files into database."""
    
    # Database path
    db_path = '/mnt/d/claude-projects/block-convey-task/llm-redteam-platform/backend/instance/redteam.db'
    
    # PromptFoo JSON files directory
    data_dir = Path('/mnt/d/claude-projects/block-convey-task/llm-redteam-platform/data/red_team_prompts')
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Clear existing prompts first
        print("Clearing existing prompts...")
        cursor.execute("DELETE FROM prompts")
        
        # Load PromptFoo prompts
        categories = ['jailbreak', 'bias', 'hallucination', 'privacy', 'manipulation']
        total_loaded = 0
        
        for category in categories:
            promptfoo_file = data_dir / f'{category}_promptfoo.json'
            
            if promptfoo_file.exists():
                print(f"Loading {category} prompts from PromptFoo...")
                
                with open(promptfoo_file, 'r', encoding='utf-8') as f:
                    prompts_data = json.load(f)
                
                for prompt_data in prompts_data:
                    # Extract PromptFoo fields
                    text = prompt_data.get('text', '')
                    source_cookbook = prompt_data.get('source_cookbook', 'PromptFoo Methodology')
                    difficulty_level = prompt_data.get('difficulty_level', 'medium')
                    expected_outcome = prompt_data.get('expected_outcome', 'blocked')
                    description = prompt_data.get('description', '')
                    tags = json.dumps(prompt_data.get('tags', [category]))
                    base_vulnerability_score = prompt_data.get('base_vulnerability_score', 5.0)
                    strategy = prompt_data.get('strategy', 'generic')
                    
                    # Insert into database
                    cursor.execute("""
                        INSERT INTO prompts (
                            category, text, source_cookbook, difficulty_level, 
                            expected_outcome, description, tags, base_vulnerability_score
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        category, text, source_cookbook, difficulty_level,
                        expected_outcome, description, tags, base_vulnerability_score
                    ))
                    
                    total_loaded += 1
                
                print(f"  Loaded {len(prompts_data)} {category} prompts")
            else:
                print(f"  Warning: {promptfoo_file} not found!")
        
        # Commit changes
        conn.commit()
        print(f"\n✅ Successfully loaded {total_loaded} PromptFoo prompts!")
        
        # Verify loading
        cursor.execute("SELECT COUNT(*) FROM prompts")
        total_prompts = cursor.fetchone()[0]
        
        cursor.execute("SELECT category, COUNT(*) FROM prompts GROUP BY category")
        categories = cursor.fetchall()
        
        print(f"\nDatabase Summary:")
        print(f"  Total prompts: {total_prompts}")
        for category, count in categories:
            print(f"  {category}: {count} prompts")
        
        # Verify PromptFoo source
        cursor.execute("SELECT COUNT(*) FROM prompts WHERE source_cookbook LIKE '%PromptFoo%'")
        promptfoo_count = cursor.fetchone()[0]
        print(f"\nPromptFoo prompts: {promptfoo_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error loading PromptFoo prompts: {e}")

if __name__ == '__main__':
    load_promptfoo_prompts()