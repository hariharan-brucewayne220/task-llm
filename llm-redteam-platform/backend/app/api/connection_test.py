"""API connection testing endpoint."""
from flask import Blueprint, request, jsonify
from app.services.llm_client import LLMClientFactory
import logging

bp = Blueprint('connection_test', __name__)

@bp.route('/test-connection', methods=['POST'])
def test_connection():
    """Test API connection with provided credentials."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        provider = data.get('provider')
        api_key = data.get('apiKey', '').strip()
        model = data.get('model')
        
        if not provider:
            return jsonify({'success': False, 'error': 'Provider is required'}), 400
        
        if not api_key:
            return jsonify({'success': False, 'error': 'API key is required'}), 400
        
        # Validate API key format
        if provider == 'openai' and not api_key.startswith('sk-'):
            return jsonify({'success': False, 'error': 'Invalid OpenAI API key format'}), 400
        elif provider == 'anthropic' and not api_key.startswith('sk-ant-'):
            return jsonify({'success': False, 'error': 'Invalid Anthropic API key format'}), 400
        elif provider == 'google' and len(api_key) < 20:
            return jsonify({'success': False, 'error': 'Invalid Google API key format'}), 400
        
        if not model:
            # Set default models
            model = {
                'openai': 'gpt-3.5-turbo',
                'anthropic': 'claude-3-haiku-20240307',
                'google': 'gemini-pro'
            }.get(provider, 'gpt-3.5-turbo')
        
        # Test the connection
        try:
            client = LLMClientFactory.create_client(provider, api_key, model)
            test_result = client.test_connection()
            
            if test_result.get('success'):
                return jsonify({
                    'success': True,
                    'provider': provider,
                    'model': model,
                    'response_time': test_result.get('response_time', 0),
                    'message': f'{provider.title()} connection successful'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': test_result.get('error', 'Connection test failed')
                }), 400
                
        except Exception as client_error:
            error_msg = str(client_error)
            
            # Parse common API errors
            if 'Incorrect API key' in error_msg or 'Invalid API key' in error_msg:
                return jsonify({'success': False, 'error': 'Invalid API key'}), 401
            elif 'quota' in error_msg.lower():
                return jsonify({'success': False, 'error': 'API quota exceeded'}), 402
            elif 'rate limit' in error_msg.lower():
                return jsonify({'success': False, 'error': 'Rate limit exceeded'}), 429
            elif 'model' in error_msg.lower() and 'not found' in error_msg.lower():
                return jsonify({'success': False, 'error': f'Model {model} not available'}), 400
            else:
                return jsonify({'success': False, 'error': f'Connection failed: {error_msg}'}), 400
        
    except Exception as e:
        logging.error(f"Connection test error: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
