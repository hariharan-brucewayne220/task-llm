import React, { useState, useEffect } from 'react';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  WifiIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import AssessmentConfig, { AssessmentConfig as AssessmentConfigType } from './AssessmentConfig';

interface SetupWizardProps {
  onSetupComplete: (setupData: SetupData) => void;
  onCancel: () => void;
}

export interface SetupData {
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;
  assessmentConfig: AssessmentConfigType;
  estimatedTimePerPrompt?: number;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onSetupComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [averageResponseTime, setAverageResponseTime] = useState<number>(0);
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const [setupData, setSetupData] = useState<SetupData>({
    selectedProvider: '',
    selectedModel: '',
    apiKeys: {},
    assessmentConfig: {
      name: 'Red Team Assessment',
      description: 'Comprehensive security testing of LLM safety mechanisms',
      testCategories: ['jailbreak', 'bias'],
      assessmentScope: {
        totalPrompts: 20,
        difficultyLevel: 'medium',
        customPrompts: []
      },
      parameters: {
        temperature: 0.7,
        maxTokens: 1000,
        timeoutSeconds: 30
      },
      scheduling: {
        immediate: true,
        scheduled: false,
        recurring: false
      },
      advancedOptions: {
        enableAdvancedMetrics: true,
        customSafeguardRules: [],
        referenceTexts: {}
      }
    }
  });

  // Available providers and their models based on API access test
  const providers = {
    openai: {
      name: 'OpenAI',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      description: '7 models accessible'
    },
    anthropic: {
      name: 'Anthropic',
      models: ['claude-3-opus-20240229', 'claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
      description: '4 models accessible'
    },
    google: {
      name: 'Google',
      models: ['gemini-1.5-flash'],
      description: '1 model accessible'
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Select LLM Provider',
      description: 'Choose your target LLM provider for testing',
      icon: '🤖'
    },
    {
      id: 2,
      title: 'Choose Model & API Key',
      description: 'Select specific model and securely input API credentials',
      icon: '🔑'
    },
    {
      id: 3,
      title: 'Validate Connection',
      description: 'Test API connection and verify permissions',
      icon: '🔗'
    },
    {
      id: 4,
      title: 'Configure Assessment',
      description: 'Set parameters and launch red team testing',
      icon: '⚙️'
    }
  ];

  const handleProviderSelect = (provider: string) => {
    setSetupData(prev => ({
      ...prev,
      selectedProvider: provider,
      selectedModel: '' // Reset model when provider changes
    }));
    setAvailableModels(providers[provider as keyof typeof providers]?.models || []);
    setConnectionStatus('idle');
  };

  const handleModelSelect = (model: string) => {
    setSetupData(prev => ({
      ...prev,
      selectedModel: model
    }));
  };

  const handleApiKeyInput = (apiKey: string) => {
    setSetupData(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [prev.selectedProvider]: apiKey
      }
    }));
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    if (!setupData.selectedProvider || !setupData.selectedModel || !setupData.apiKeys[setupData.selectedProvider]) {
      setConnectionError('Please select provider, model, and enter API key');
      return;
    }

    setConnectionStatus('testing');
    setConnectionError('');
    setConnectionMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // Make real API call to test connection (like quick_sanity_test.py)
      const response = await fetch(`${apiUrl}/api/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: setupData.selectedProvider,
          model: setupData.selectedModel,
          api_key: setupData.apiKeys[setupData.selectedProvider]
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConnectionStatus('success');
        setConnectionMessage(`Connection successful! Response in ${result.response_time}s`);
        
        // Store response time for estimated time calculation
        setAverageResponseTime(result.response_time);
        
        console.log(`✅ Connection successful! Response in ${result.response_time}s`);
        console.log(`Response preview: ${result.response_preview}`);
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Connection test failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError('Failed to connect to backend server. Please ensure the server is running.');
      console.error('Connection test error:', error);
    }
  };

  const handleAssessmentConfigChange = (config: Partial<AssessmentConfigType>) => {
    setSetupData(prev => ({
      ...prev,
      assessmentConfig: {
        ...prev.assessmentConfig,
        ...config
      }
    }));
  };

  const handleAssessmentConfigSubmit = (config: AssessmentConfigType) => {
    setSetupData(prev => ({
      ...prev,
      assessmentConfig: config
    }));
    // Don't auto-advance - let user click "Launch Assessment"
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!setupData.selectedProvider;
      case 2:
        return !!setupData.selectedModel && !!setupData.apiKeys[setupData.selectedProvider];
      case 3:
        return connectionStatus === 'success';
      case 4:
        return setupData.assessmentConfig.testCategories.length > 0;
      default:
        return true;
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: User selects target LLM provider
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Step 1: Select LLM Provider
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose your target LLM provider for red team testing
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(providers).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => handleProviderSelect(key)}
                  className={`p-6 border-2 rounded-lg transition-all hover:shadow-lg ${
                    setupData.selectedProvider === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-3">
                      {key === 'openai' ? '🤖' : key === 'anthropic' ? '🧠' : '🔍'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {provider.description}
                    </p>
                    {setupData.selectedProvider === key && (
                      <div className="flex items-center justify-center mt-3">
                        <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Selected</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {setupData.selectedProvider && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 dark:text-green-400">
                    Selected: {providers[setupData.selectedProvider as keyof typeof providers]?.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        // Step 2: User selects specific model and inputs API credentials
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Step 2: Choose Model & API Key
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select specific model and securely input API credentials
              </p>
            </div>

            {/* Model Selection */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Available Models for {providers[setupData.selectedProvider as keyof typeof providers]?.name}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {availableModels.map((model) => (
                  <button
                    key={model}
                    onClick={() => handleModelSelect(model)}
                    className={`p-4 text-left border rounded-lg transition-all hover:shadow-sm ${
                      setupData.selectedModel === model
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                    title={model} // Add tooltip for long model names
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white truncate pr-2 max-w-[200px]">{model}</span>
                      {setupData.selectedModel === model && (
                        <CheckIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Input */}
            {setupData.selectedModel && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  API Credentials
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {providers[setupData.selectedProvider as keyof typeof providers]?.name} API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={setupData.apiKeys[setupData.selectedProvider] || ''}
                        onChange={(e) => handleApiKeyInput(e.target.value)}
                        placeholder={`Enter your ${providers[setupData.selectedProvider as keyof typeof providers]?.name} API key`}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showApiKey ? (
                          <EyeSlashIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <WifiIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Security Notice</h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          <p>• API keys are encrypted and stored securely</p>
                          <p>• Connection will be validated in the next step</p>
                          <p>• Keys are never shared or logged</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        // Step 3: System validates connection and permissions
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Step 3: Validate Connection
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Test API connection and verify permissions
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Provider
                  </h4>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {providers[setupData.selectedProvider as keyof typeof providers]?.name}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Model
                  </h4>
                  <p className="text-lg font-medium text-gray-900 dark:text-white break-words" title={setupData.selectedModel}>
                    {setupData.selectedModel}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Connection Test
                </h3>
                <button
                  onClick={testConnection}
                  disabled={connectionStatus === 'testing'}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {connectionStatus === 'testing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <WifiIcon className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </button>
              </div>

              {connectionStatus === 'success' && (
                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-green-800 dark:text-green-400 font-medium">Connection Successful!</p>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {connectionMessage || 'API key validated and permissions confirmed'}
                    </p>
                  </div>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <XCircleIcon className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <p className="text-red-800 dark:text-red-400 font-medium">Connection Failed</p>
                    <p className="text-red-700 dark:text-red-300 text-sm">{connectionError}</p>
                  </div>
                </div>
              )}

              {connectionStatus === 'idle' && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">
                    Click "Test Connection" to validate your API key and verify permissions.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        // Step 4: User configures assessment parameters
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Step 4: Configure Assessment
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Set parameters and launch red team testing
              </p>
            </div>

            <AssessmentConfig
              initialConfig={setupData.assessmentConfig}
              onConfigChange={handleAssessmentConfigChange}
              onConfigSubmit={handleAssessmentConfigSubmit}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Setup Red Team Assessment</h1>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          {getStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={() => onSetupComplete({
                ...setupData,
                estimatedTimePerPrompt: averageResponseTime
              })}
              disabled={!canProceedToNext()}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Launch Assessment
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
