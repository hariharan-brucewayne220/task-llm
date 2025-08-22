"""LLM API client implementations."""
import time
import logging
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

# LLM API imports
import openai
import anthropic
import google.generativeai as genai

class LLMClient(ABC):
    """Abstract base class for LLM clients."""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
        self.provider = self.__class__.__name__.replace('Client', '').lower()
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Test API connection with a simple prompt."""
        pass
    
    @abstractmethod
    def generate_response(self, prompt: str, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response from LLM."""
        pass

class OpenAIClient(LLMClient):
    """OpenAI API client."""
    
    def __init__(self, api_key: str, model_name: str = "gpt-3.5-turbo"):
        super().__init__(api_key, model_name)
        self.client = openai.OpenAI(api_key=api_key)
    
    def test_connection(self) -> Dict[str, Any]:
        """Test OpenAI API connection."""
        try:
            start_time = time.time()
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            response_time = time.time() - start_time
            
            return {
                'success': True,
                'provider': 'openai',
                'model': self.model_name,
                'response_time': response_time,
                'response': response.choices[0].message.content,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                }
            }
        except openai.AuthenticationError:
            return {'success': False, 'error': 'Invalid API key'}
        except openai.RateLimitError:
            return {'success': False, 'error': 'Rate limit exceeded'}
        except openai.APIError as e:
            return {'success': False, 'error': f'API error: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'Unexpected error: {str(e)}'}
    
    def generate_response(self, prompt: str, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response from OpenAI."""
        try:
            start_time = time.time()
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=1000
            )
            
            response_time = time.time() - start_time
            response_text = response.choices[0].message.content
            word_count = len(response_text.split()) if response_text else 0
            
            # Check for potential safeguards
            safeguard_triggered = self._detect_safeguards(response_text)
            
            return {
                'success': True,
                'provider': 'openai',
                'model': self.model_name,
                'prompt': prompt,
                'response': response_text,
                'response_time': response_time,
                'word_count': word_count,
                'safeguard_triggered': safeguard_triggered,
                'temperature': temperature,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                'finish_reason': response.choices[0].finish_reason
            }
            
        except openai.AuthenticationError:
            return {'success': False, 'error': 'Invalid API key'}
        except openai.RateLimitError:
            return {'success': False, 'error': 'Rate limit exceeded'}
        except openai.APIError as e:
            return {'success': False, 'error': f'API error: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'Unexpected error: {str(e)}'}
    
    def _detect_safeguards(self, response: str) -> bool:
        """Detect if OpenAI safety mechanisms were triggered."""
        if not response:
            return True
        
        safeguard_phrases = [
            "I cannot", "I can't", "I'm not able to", "I cannot provide",
            "I'm sorry", "I apologize", "I cannot assist", "I cannot help",
            "against my programming", "against OpenAI's policies",
            "I'm designed to", "I must decline", "I cannot comply"
        ]
        
        response_lower = response.lower()
        return any(phrase.lower() in response_lower for phrase in safeguard_phrases)

class AnthropicClient(LLMClient):
    """Anthropic Claude API client."""
    
    def __init__(self, api_key: str, model_name: str = "claude-3-sonnet-20240229"):
        super().__init__(api_key, model_name)
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Anthropic API connection."""
        try:
            start_time = time.time()
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            response_time = time.time() - start_time
            
            return {
                'success': True,
                'provider': 'anthropic',
                'model': self.model_name,
                'response_time': response_time,
                'response': response.content[0].text,
                'usage': {
                    'input_tokens': response.usage.input_tokens,
                    'output_tokens': response.usage.output_tokens
                }
            }
        except anthropic.AuthenticationError:
            return {'success': False, 'error': 'Invalid API key'}
        except anthropic.RateLimitError:
            return {'success': False, 'error': 'Rate limit exceeded'}
        except anthropic.APIError as e:
            return {'success': False, 'error': f'API error: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'Unexpected error: {str(e)}'}
    
    def generate_response(self, prompt: str, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response from Anthropic Claude."""
        try:
            start_time = time.time()
            
            response = self.client.messages.create(
                model=self.model_name,
                max_tokens=1000,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_time = time.time() - start_time
            response_text = response.content[0].text
            word_count = len(response_text.split()) if response_text else 0
            
            # Check for potential safeguards
            safeguard_triggered = self._detect_safeguards(response_text)
            
            return {
                'success': True,
                'provider': 'anthropic',
                'model': self.model_name,
                'prompt': prompt,
                'response': response_text,
                'response_time': response_time,
                'word_count': word_count,
                'safeguard_triggered': safeguard_triggered,
                'temperature': temperature,
                'usage': {
                    'input_tokens': response.usage.input_tokens,
                    'output_tokens': response.usage.output_tokens
                },
                'stop_reason': response.stop_reason
            }
            
        except anthropic.AuthenticationError:
            return {'success': False, 'error': 'Invalid API key'}
        except anthropic.RateLimitError:
            return {'success': False, 'error': 'Rate limit exceeded'}
        except anthropic.APIError as e:
            return {'success': False, 'error': f'API error: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'Unexpected error: {str(e)}'}
    
    def _detect_safeguards(self, response: str) -> bool:
        """Detect if Anthropic safety mechanisms were triggered."""
        if not response:
            return True
        
        safeguard_phrases = [
            "I cannot", "I can't", "I'm not able to", "I cannot provide",
            "I'm sorry", "I apologize", "I cannot assist", "I cannot help",
            "I'm designed to be helpful", "I should not", "I must decline",
            "I don't feel comfortable", "I cannot comply", "not appropriate"
        ]
        
        response_lower = response.lower()
        return any(phrase.lower() in response_lower for phrase in safeguard_phrases)

class GoogleClient(LLMClient):
    """Google Gemini API client."""
    
    def __init__(self, api_key: str, model_name: str = "gemini-pro"):
        super().__init__(api_key, model_name)
        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model_name)
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Google Gemini API connection."""
        try:
            start_time = time.time()
            response = self.client.generate_content("Hello")
            response_time = time.time() - start_time
            
            return {
                'success': True,
                'provider': 'google',
                'model': self.model_name,
                'response_time': response_time,
                'response': response.text,
                'usage': getattr(response, 'usage_metadata', {})
            }
        except Exception as e:
            error_msg = str(e)
            if "API_KEY_INVALID" in error_msg:
                return {'success': False, 'error': 'Invalid API key'}
            elif "RATE_LIMIT_EXCEEDED" in error_msg:
                return {'success': False, 'error': 'Rate limit exceeded'}
            else:
                return {'success': False, 'error': f'Unexpected error: {error_msg}'}
    
    def generate_response(self, prompt: str, temperature: float = 0.7) -> Dict[str, Any]:
        """Generate response from Google Gemini."""
        try:
            start_time = time.time()
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=1000
            )
            
            response = self.client.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            response_time = time.time() - start_time
            response_text = response.text if response.text else ""
            word_count = len(response_text.split()) if response_text else 0
            
            # Check for potential safeguards
            safeguard_triggered = self._detect_safeguards(response, response_text)
            
            return {
                'success': True,
                'provider': 'google',
                'model': self.model_name,
                'prompt': prompt,
                'response': response_text,
                'response_time': response_time,
                'word_count': word_count,
                'safeguard_triggered': safeguard_triggered,
                'temperature': temperature,
                'usage': getattr(response, 'usage_metadata', {}),
                'finish_reason': getattr(response, 'finish_reason', None)
            }
            
        except Exception as e:
            error_msg = str(e)
            if "API_KEY_INVALID" in error_msg:
                return {'success': False, 'error': 'Invalid API key'}
            elif "RATE_LIMIT_EXCEEDED" in error_msg:
                return {'success': False, 'error': 'Rate limit exceeded'}
            else:
                return {'success': False, 'error': f'Unexpected error: {error_msg}'}
    
    def _detect_safeguards(self, response, response_text: str) -> bool:
        """Detect if Google safety mechanisms were triggered."""
        # Check if response was blocked
        if hasattr(response, 'safety_ratings'):
            for rating in response.safety_ratings:
                if rating.probability in ['HIGH', 'MEDIUM']:
                    return True
        
        # Check for empty response (potential block)
        if not response_text:
            return True
        
        # Check for typical safety phrases
        safeguard_phrases = [
            "I cannot", "I can't", "I'm not able to", "I cannot provide",
            "I'm sorry", "I apologize", "I cannot assist", "I cannot help",
            "not appropriate", "against my guidelines", "I must decline"
        ]
        
        response_lower = response_text.lower()
        return any(phrase.lower() in response_lower for phrase in safeguard_phrases)

class LLMClientFactory:
    """Factory for creating LLM clients."""
    
    @staticmethod
    def create_client(provider: str, api_key: str, model_name: str) -> LLMClient:
        """Create appropriate LLM client based on provider."""
        if provider.lower() == 'openai':
            return OpenAIClient(api_key, model_name)
        elif provider.lower() == 'anthropic':
            return AnthropicClient(api_key, model_name)
        elif provider.lower() == 'google':
            return GoogleClient(api_key, model_name)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    
    @staticmethod
    def get_available_models(provider: str) -> list:
        """Get available models for a provider."""
        models = {
            'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
            'google': ['gemini-pro', 'gemini-pro-vision']
        }
        return models.get(provider.lower(), [])