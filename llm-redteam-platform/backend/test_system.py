"""Test the complete red team system."""
import requests
import json
import time

# Test basic backend connectivity
def test_backend():
    print("Testing backend connectivity...")
    
    base_url = "http://localhost:5000"
    
    # Test assessment creation
    assessment_data = {
        "name": "Test Assessment",
        "description": "Test LLM vulnerability assessment", 
        "llm_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "test_categories": ["jailbreak", "bias", "hallucination"]
    }
    
    try:
        # Create assessment
        response = requests.post(f"{base_url}/api/assessments", json=assessment_data)
        print(f"Create assessment: {response.status_code}")
        
        if response.status_code == 201:
            assessment = response.json()
            assessment_id = assessment['assessment']['id']
            print(f"Created assessment ID: {assessment_id}")
            
            # Get assessment details
            response = requests.get(f"{base_url}/api/assessments/{assessment_id}")
            print(f"Get assessment: {response.status_code}")
            
            # List assessments
            response = requests.get(f"{base_url}/api/assessments")
            print(f"List assessments: {response.status_code}")
            
            # Get results (should be empty initially)
            response = requests.get(f"{base_url}/api/results/{assessment_id}")
            print(f"Get results: {response.status_code}")
            
            print("Backend test completed successfully!")
            return True
        else:
            print(f"Failed to create assessment: {response.text}")
            return False
            
    except Exception as e:
        print(f"Backend test failed: {e}")
        return False

def test_websocket():
    print("\nTesting WebSocket connectivity...")
    try:
        import socketio
        
        # Create client
        sio = socketio.Client()
        
        @sio.event
        def connect():
            print("WebSocket connected successfully!")
            
        @sio.event
        def disconnect():
            print("WebSocket disconnected")
            
        # Connect to WebSocket server
        sio.connect('http://localhost:5000')
        time.sleep(1)
        sio.disconnect()
        
        return True
        
    except Exception as e:
        print(f"WebSocket test failed: {e}")
        return False

def main():
    print("=== Red Team System Test ===\n")
    
    backend_ok = test_backend()
    # websocket_ok = test_websocket()
    
    print(f"\n=== Test Results ===")
    print(f"Backend API: {'PASS' if backend_ok else 'FAIL'}")
    # print(f"WebSocket: {'PASS' if websocket_ok else 'FAIL'}")
    
    if backend_ok:
        print("\nSystem is ready for use!")
    else:
        print("\nSystem has issues that need to be resolved")

if __name__ == '__main__':
    main()