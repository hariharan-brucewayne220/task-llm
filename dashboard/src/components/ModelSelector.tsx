import React, { useState } from 'react';
import { ChevronDownIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ModelSelectorProps {
  onModelSelect: (provider: string, model: string) => void;
  onApiKeyInput: (provider: string, apiKey: string) => void;
  selectedProvider?: string;
  selectedModel?: string;
}

interface ModelOption {
  name: string;
  category: 'Premium' | 'Performance' | 'Standard';
  description: string;
  bestFor: string;
  responseTime: string;
  deprecated?: boolean;
  deprecationDate?: string;
}

const MODEL_OPTIONS = {
  openai: [
    {
      name: 'gpt-4',
      category: 'Premium' as const,
      description: 'Most capable model, highest safety',
      bestFor: 'Maximum safety testing, complex reasoning',
      responseTime: '2.3s'
    },
    {
      name: 'gpt-4-turbo',
      category: 'Premium' as const,
      description: 'Latest GPT-4 variant, optimized performance',
      bestFor: 'Balanced performance and safety',
      responseTime: '1.9s'
    },
    {
      name: 'gpt-4o',
      category: 'Premium' as const,
      description: 'Latest GPT-4 model, balanced capabilities',
      bestFor: 'Modern GPT-4 features',
      responseTime: '1.0s'
    },
    {
      name: 'gpt-4o-mini',
      category: 'Performance' as const,
      description: 'Fastest GPT-4 variant, cost-effective',
      bestFor: 'Fast testing, cost optimization',
      responseTime: '0.8s'
    },
    {
      name: 'gpt-4-turbo-preview',
      category: 'Performance' as const,
      description: 'Preview version, very fast responses',
      bestFor: 'Fast preview features',
      responseTime: '0.9s'
    },
    {
      name: 'gpt-3.5-turbo',
      category: 'Standard' as const,
      description: 'Reliable workhorse, great for testing',
      bestFor: 'Cost-effective testing',
      responseTime: '0.9s'
    },
    {
      name: 'gpt-3.5-turbo-16k',
      category: 'Standard' as const,
      description: 'Extended context, fastest response time',
      bestFor: 'Long context, fast responses',
      responseTime: '0.7s'
    }
  ],
  anthropic: [
    {
      name: 'claude-3-opus-20240229',
      category: 'Premium' as const,
      description: 'Most capable, hardest to jailbreak',
      bestFor: 'Maximum safety testing',
      responseTime: '1.6s',
      deprecated: true,
      deprecationDate: 'Jan 5, 2026'
    },
    {
      name: 'claude-3-5-sonnet-20241022',
      category: 'Premium' as const,
      description: 'Latest Sonnet model',
      bestFor: 'Latest safety features',
      responseTime: '2.2s',
      deprecated: true,
      deprecationDate: 'Oct 22, 2025'
    },
    {
      name: 'claude-3-haiku-20240307',
      category: 'Performance' as const,
      description: 'Fastest, most cost-effective',
      bestFor: 'Fast testing, cost optimization',
      responseTime: '0.6s'
    },
    {
      name: 'claude-3-5-haiku-20241022',
      category: 'Performance' as const,
      description: 'Latest Haiku model',
      bestFor: 'Latest fast model',
      responseTime: '1.1s'
    }
  ],
  google: [
    {
      name: 'gemini-1.5-flash',
      category: 'Standard' as const,
      description: 'Fast, efficient, good for basic testing',
      bestFor: 'Basic testing, cost-effective',
      responseTime: '0.7s'
    }
  ]
};

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    color: 'bg-green-100 border-green-300 text-green-800',
    icon: '🤖'
  },
  anthropic: {
    name: 'Anthropic Claude',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    icon: '🧠'
  },
  google: {
    name: 'Google Gemini',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    icon: '🔮'
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  onApiKeyInput,
  selectedProvider,
  selectedModel
}) => {
  const [activeProvider, setActiveProvider] = useState(selectedProvider || 'openai');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [connectionStatus, setConnectionStatus] = useState({
    openai: 'not-tested',
    anthropic: 'not-tested',
    google: 'not-tested'
  });
  const [lastError, setLastError] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });

  const handleApiKeyChange = (provider: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    // Reset connection status and clear errors when API key changes
    setConnectionStatus(prev => ({ ...prev, [provider]: 'not-tested' }));
    setLastError(prev => ({ ...prev, [provider]: '' }));
    onApiKeyInput(provider, key);
  };

  const testConnection = async (provider: string) => {
    const apiKey = apiKeys[provider as keyof typeof apiKeys];
    
    if (!apiKey || !apiKey.trim()) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      return;
    }

    setConnectionStatus(prev => ({ ...prev, [provider]: 'testing' }));
    
    try {
      // Real API key validation
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          apiKey: apiKey.trim(), // Trim whitespace
          model: provider === 'openai' ? 'gpt-3.5-turbo' : 
                 provider === 'anthropic' ? 'claude-3-haiku-20240307' :
                 'gemini-pro'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'connected' }));
        setLastError(prev => ({ ...prev, [provider]: '' }));
      } else {
        const errorMsg = result.error || 'Connection failed';
        console.error(`${provider} connection failed:`, errorMsg);
        setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
        setLastError(prev => ({ ...prev, [provider]: errorMsg }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      console.error(`${provider} connection error:`, errorMsg);
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      setLastError(prev => ({ ...prev, [provider]: errorMsg }));
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'testing':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'failed':
        return 'Connection Failed';
      case 'testing':
        return 'Testing...';
      default:
        return 'Not Tested';
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select LLM Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PROVIDER_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setActiveProvider(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeProvider === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{info.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{info.name}</div>
                  <div className="text-sm text-gray-500">
                    {MODEL_OPTIONS[key as keyof typeof MODEL_OPTIONS].length} models available
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* API Key Input */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
        <div className="space-y-4">
          {Object.entries(PROVIDER_INFO).map(([key, info]) => (
            <div key={key} className={`p-4 rounded-lg ${info.color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium">{info.name} API Key</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getConnectionStatusIcon(connectionStatus[key as keyof typeof connectionStatus])}
                  <span className="text-sm">{getConnectionStatusText(connectionStatus[key as keyof typeof connectionStatus])}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder={`Enter ${info.name} API key`}
                  value={apiKeys[key as keyof typeof apiKeys]}
                  onChange={(e) => handleApiKeyChange(key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => testConnection(key)}
                  disabled={!apiKeys[key as keyof typeof apiKeys] || connectionStatus[key as keyof typeof connectionStatus] === 'testing'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test
                </button>
              </div>
              {lastError[key as keyof typeof lastError] && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  <span className="font-medium">Error: </span>
                  {lastError[key as keyof typeof lastError]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Model</h3>
        <div className="space-y-4">
          {MODEL_OPTIONS[activeProvider as keyof typeof MODEL_OPTIONS].map((model) => (
            <div
              key={model.name}
              onClick={() => onModelSelect(activeProvider, model.name)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedModel === model.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{model.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      model.category === 'Premium' ? 'bg-purple-100 text-purple-800' :
                      model.category === 'Performance' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {model.category}
                    </span>
                    {(model as any).deprecated && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        ⚠️ Deprecated {(model as any).deprecationDate}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Best for: {model.bestFor}</span>
                    <span>Response time: {model.responseTime}</span>
                  </div>
                </div>
                {selectedModel === model.name && (
                  <CheckIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Model Recommendations</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Maximum Safety Testing:</strong> GPT-4, Claude-3-Opus</p>
          <p><strong>Fast Testing:</strong> Claude-3-Haiku, GPT-4o-Mini</p>
          <p><strong>Cost-Effective:</strong> GPT-3.5-Turbo, Claude-3-Haiku</p>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
