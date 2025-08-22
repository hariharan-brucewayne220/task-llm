#!/usr/bin/env python3
"""
Comprehensive API Access Testing Script
Tests all available API keys and discovers accessible models
"""

import os
import time
import requests
import json
from typing import Dict, List, Any

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

import openai
import anthropic
import google.generativeai as genai

class APITester:
    """Test API access for all providers and discover available models."""
    
    def __init__(self):
        self.results = {}
        self.api_keys = {}
        self.load_api_keys()
    
    def load_api_keys(self):
        """Load API keys from environment variables."""
        self.api_keys = {
            'openai': os.getenv('OPENAI_API_KEY'),
            'anthropic': os.getenv('ANTHROPIC_API_KEY'),
            'google': os.getenv('GOOGLE_API_KEY')
        }
        
        print("🔑 API Keys Status:")
        for provider, key in self.api_keys.items():
            status = "✅ SET" if key else "❌ NOT SET"
            masked_key = f"{key[:8]}...{key[-4:]}" if key else "None"
            print(f"  {provider.upper()}: {status} - {masked_key}")
        print()
    
    def test_openai_models(self) -> Dict[str, Any]:
        """Test OpenAI models and discover accessible ones."""
        if not self.api_keys['openai']:
            return {'error': 'No OpenAI API key found'}
        
        print("🤖 Testing OpenAI Models...")
        results = {'provider': 'openai', 'models': [], 'errors': []}
        
        # Test different model variants
        test_models = [
            'gpt-4',
            'gpt-4-turbo',
            'gpt-4-turbo-preview',
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
        ]
        
        client = openai.OpenAI(api_key=self.api_keys['openai'])
        
        for model in test_models:
            try:
                print(f"  Testing {model}...")
                start_time = time.time()
                
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "Hello, this is a test."}],
                    max_tokens=10
                )
                
                response_time = time.time() - start_time
                
                model_info = {
                    'name': model,
                    'accessible': True,
                    'response_time': round(response_time, 3),
                    'response': response.choices[0].message.content,
                    'usage': {
                        'prompt_tokens': response.usage.prompt_tokens,
                        'completion_tokens': response.usage.completion_tokens,
                        'total_tokens': response.usage.total_tokens
                    }
                }
                
                results['models'].append(model_info)
                print(f"    ✅ {model} - Accessible ({response_time:.3f}s)")
                
            except openai.AuthenticationError:
                results['errors'].append(f"{model}: Authentication failed")
                print(f"    ❌ {model} - Authentication failed")
            except openai.NotFoundError:
                results['errors'].append(f"{model}: Model not found")
                print(f"    ❌ {model} - Model not found")
            except openai.RateLimitError:
                results['errors'].append(f"{model}: Rate limit exceeded")
                print(f"    ❌ {model} - Rate limit exceeded")
            except Exception as e:
                results['errors'].append(f"{model}: {str(e)}")
                print(f"    ❌ {model} - Error: {str(e)}")
            
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_anthropic_models(self) -> Dict[str, Any]:
        """Test Anthropic models and discover accessible ones."""
        if not self.api_keys['anthropic']:
            return {'error': 'No Anthropic API key found'}
        
        print("🤖 Testing Anthropic Models...")
        results = {'provider': 'anthropic', 'models': [], 'errors': []}
        
        # Test different Claude models
        test_models = [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022'
        ]
        
        client = anthropic.Anthropic(api_key=self.api_keys['anthropic'])
        
        for model in test_models:
            try:
                print(f"  Testing {model}...")
                start_time = time.time()
                
                response = client.messages.create(
                    model=model,
                    max_tokens=10,
                    messages=[{"role": "user", "content": "Hello, this is a test."}]
                )
                
                response_time = time.time() - start_time
                
                model_info = {
                    'name': model,
                    'accessible': True,
                    'response_time': round(response_time, 3),
                    'response': response.content[0].text,
                    'usage': {
                        'input_tokens': response.usage.input_tokens,
                        'output_tokens': response.usage.output_tokens
                    }
                }
                
                results['models'].append(model_info)
                print(f"    ✅ {model} - Accessible ({response_time:.3f}s)")
                
            except anthropic.AuthenticationError:
                results['errors'].append(f"{model}: Authentication failed")
                print(f"    ❌ {model} - Authentication failed")
            except anthropic.NotFoundError:
                results['errors'].append(f"{model}: Model not found")
                print(f"    ❌ {model} - Model not found")
            except anthropic.RateLimitError:
                results['errors'].append(f"{model}: Rate limit exceeded")
                print(f"    ❌ {model} - Rate limit exceeded")
            except Exception as e:
                results['errors'].append(f"{model}: {str(e)}")
                print(f"    ❌ {model} - Error: {str(e)}")
            
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_google_models(self) -> Dict[str, Any]:
        """Test Google Gemini models and discover accessible ones."""
        if not self.api_keys['google']:
            return {'error': 'No Google API key found'}
        
        print("🤖 Testing Google Gemini Models...")
        results = {'provider': 'google', 'models': [], 'errors': []}
        
        # Test different Gemini models
        test_models = [
            'gemini-pro',
            'gemini-pro-vision',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ]
        
        genai.configure(api_key=self.api_keys['google'])
        
        for model in test_models:
            try:
                print(f"  Testing {model}...")
                start_time = time.time()
                
                # Skip vision models for text-only test
                if 'vision' in model:
                    print(f"    ⚠️  {model} - Vision model, skipping text test")
                    continue
                
                client = genai.GenerativeModel(model)
                response = client.generate_content("Hello, this is a test.")
                
                response_time = time.time() - start_time
                
                model_info = {
                    'name': model,
                    'accessible': True,
                    'response_time': round(response_time, 3),
                    'response': response.text,
                    'usage': getattr(response, 'usage_metadata', {})
                }
                
                results['models'].append(model_info)
                print(f"    ✅ {model} - Accessible ({response_time:.3f}s)")
                
            except Exception as e:
                error_msg = str(e)
                if "API_KEY_INVALID" in error_msg:
                    results['errors'].append(f"{model}: Invalid API key")
                    print(f"    ❌ {model} - Invalid API key")
                elif "RATE_LIMIT_EXCEEDED" in error_msg:
                    results['errors'].append(f"{model}: Rate limit exceeded")
                    print(f"    ❌ {model} - Rate limit exceeded")
                elif "not found" in error_msg.lower():
                    results['errors'].append(f"{model}: Model not found")
                    print(f"    ❌ {model} - Model not found")
                else:
                    results['errors'].append(f"{model}: {error_msg}")
                    print(f"    ❌ {model} - Error: {error_msg}")
            
            time.sleep(0.5)  # Rate limiting
        
        return results
    
    def test_all_providers(self):
        """Test all available providers."""
        print("🚀 Starting Comprehensive API Access Test")
        print("=" * 50)
        
        # Test each provider
        self.results['openai'] = self.test_openai_models()
        print()
        
        self.results['anthropic'] = self.test_anthropic_models()
        print()
        
        self.results['google'] = self.test_google_models()
        print()
        
        self.generate_summary()
    
    def generate_summary(self):
        """Generate a comprehensive summary of accessible models."""
        print("📊 API ACCESS SUMMARY")
        print("=" * 50)
        
        total_accessible = 0
        
        for provider, result in self.results.items():
            if 'error' in result:
                print(f"\n❌ {provider.upper()}: {result['error']}")
                continue
            
            accessible_count = len(result['models'])
            total_accessible += accessible_count
            
            print(f"\n✅ {provider.upper()}: {accessible_count} models accessible")
            
            for model in result['models']:
                print(f"  • {model['name']} ({model['response_time']}s)")
                print(f"    Response: {model['response'][:50]}...")
            
            if result['errors']:
                print(f"  ❌ Errors: {len(result['errors'])} models failed")
                for error in result['errors'][:3]:  # Show first 3 errors
                    print(f"    - {error}")
        
        print(f"\n🎯 TOTAL ACCESSIBLE MODELS: {total_accessible}")
        
        # Save results to file
        self.save_results()
    
    def save_results(self):
        """Save test results to a JSON file."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"api_access_test_results_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Results saved to: {filename}")
        
        # Also save a human-readable summary
        summary_filename = f"api_access_summary_{timestamp}.txt"
        with open(summary_filename, 'w') as f:
            f.write("API ACCESS TEST SUMMARY\n")
            f.write("=" * 50 + "\n\n")
            
            for provider, result in self.results.items():
                if 'error' in result:
                    f.write(f"{provider.upper()}: {result['error']}\n")
                else:
                    f.write(f"{provider.upper()}: {len(result['models'])} models accessible\n")
                    for model in result['models']:
                        f.write(f"  - {model['name']}\n")
                f.write("\n")
        
        print(f"📝 Summary saved to: {summary_filename}")

def main():
    """Main function to run the API test."""
    tester = APITester()
    tester.test_all_providers()

if __name__ == "__main__":
    main()
