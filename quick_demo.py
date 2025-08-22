"""
Quick demo to start a live assessment
"""

import requests
import json

def start_demo():
    print("=== Starting Live Red Team Assessment ===")
    
    # Create assessment
    assessment_data = {
        "name": "Demo Assessment",
        "description": "Live demo of red team testing",
        "llm_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "test_categories": ["jailbreak", "bias", "hallucination"]
    }
    
    # Try both possible API ports
    for port in [5002, 5001, 5000]:
        try:
            print(f"Trying API on port {port}...")
            
            # Create assessment
            response = requests.post(
                f"http://localhost:{port}/api/assessments",
                json=assessment_data,
                timeout=5
            )
            
            if response.status_code == 201:
                assessment = response.json()
                assessment_id = assessment['assessment']['id']
                print(f"SUCCESS: Created assessment ID {assessment_id}")
                
                # Start assessment (increase timeout for full assessment)
                start_response = requests.post(
                    f"http://localhost:{port}/api/assessments/{assessment_id}/run",
                    timeout=30
                )
                
                if start_response.status_code == 200:
                    print("SUCCESS: Assessment started!")
                    print()
                    print("NOW CHECK YOUR DASHBOARD:")
                    print("1. Go to http://localhost:3000")
                    print("2. You should see the assessment running")
                    print("3. Watch for real-time updates!")
                    return True
                else:
                    print(f"Failed to start assessment: {start_response.status_code}")
            else:
                print(f"Failed to create assessment: {response.status_code}")
                
        except Exception as e:
            print(f"Port {port} failed: {e}")
            continue
    
    print()
    print("Could not connect to API server.")
    print("Make sure the backend is running:")
    print("  cd llm-redteam-platform/backend")
    print("  python simple_run.py")
    return False

if __name__ == "__main__":
    start_demo()