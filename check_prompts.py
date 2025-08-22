#!/usr/bin/env python3
"""Simple script to check prompts in database."""
import sqlite3
import json

# Connect to database
db_path = '/mnt/d/claude-projects/block-convey-task/llm-redteam-platform/backend/instance/redteam.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check total prompts
    cursor.execute("SELECT COUNT(*) FROM prompts")
    total_prompts = cursor.fetchone()[0]
    print(f"Total prompts in database: {total_prompts}")
    
    # Check by category
    cursor.execute("SELECT category, COUNT(*) FROM prompts GROUP BY category")
    categories = cursor.fetchall()
    print("\nPrompts by category:")
    for category, count in categories:
        print(f"  {category}: {count}")
    
    # Check source cookbooks
    cursor.execute("SELECT source_cookbook, COUNT(*) FROM prompts GROUP BY source_cookbook")
    sources = cursor.fetchall()
    print("\nPrompts by source:")
    for source, count in sources:
        print(f"  {source or 'No source'}: {count}")
    
    # Show sample PromptFoo prompts
    cursor.execute("SELECT category, text, source_cookbook FROM prompts WHERE source_cookbook LIKE '%PromptFoo%' LIMIT 5")
    promptfoo_samples = cursor.fetchall()
    
    if promptfoo_samples:
        print("\nSample PromptFoo prompts:")
        for category, text, source in promptfoo_samples:
            print(f"  [{category}] {text[:60]}..." + (f" (Source: {source})" if source else ""))
    else:
        print("\nNo PromptFoo prompts found in database!")
    
    conn.close()
    
except Exception as e:
    print(f"Error checking database: {e}")