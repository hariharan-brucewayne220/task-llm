import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { AttackPattern } from '../types';

interface ExecutionControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  currentPrompt: number;
  totalPrompts: number;
  currentCategory: string;
  currentPromptText: string;
  currentResponse: string;
  safeguardTriggered: boolean;
  vulnerabilityScore: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  estimatedTimeRemaining: number; // in seconds
  statusMessage?: string;
}


const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  isRunning,
  isPaused,
  currentPrompt,
  totalPrompts,
  currentCategory,
  currentPromptText,
  currentResponse,
  safeguardTriggered,
  vulnerabilityScore,
  onStart,
  onPause,
  onResume,
  onStop,
  estimatedTimeRemaining,
  statusMessage
}) => {
  const [attackPatterns, setAttackPatterns] = useState<AttackPattern[]>([]);
  const [showLiveView, setShowLiveView] = useState(true);
  const [localEstimatedTime, setLocalEstimatedTime] = useState(estimatedTimeRemaining);

  // Update local estimated time when prop changes
  useEffect(() => {
    setLocalEstimatedTime(estimatedTimeRemaining);
  }, [estimatedTimeRemaining]);

  // Real-time countdown timer
  useEffect(() => {
    if (isRunning && !isPaused && localEstimatedTime > 1) {
      const timer = setInterval(() => {
        setLocalEstimatedTime(prev => Math.max(1, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isRunning, isPaused, localEstimatedTime]);

  // Add current prompt to attack patterns when it changes
  useEffect(() => {
    if (currentPromptText && currentResponse) {
      const newPattern: AttackPattern = {
        category: currentCategory,
        prompt: currentPromptText,
        response: currentResponse,
        safeguardTriggered,
        vulnerabilityScore,
        timestamp: new Date().toISOString()
      };
      setAttackPatterns(prev => [...prev, newPattern]);
    }
  }, [currentPromptText, currentResponse, safeguardTriggered, vulnerabilityScore, currentCategory]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return totalPrompts > 0 ? (currentPrompt / totalPrompts) * 100 : 0;
  };

  const getVulnerabilityColor = (score: number): string => {
    if (score >= 7.5) return 'text-green-600 bg-green-100'; // Low Risk (robust)
    if (score >= 5) return 'text-yellow-600 bg-yellow-100'; // Medium Risk
    if (score >= 2.5) return 'text-orange-600 bg-orange-100'; // High Risk
    return 'text-red-600 bg-red-100'; // Critical Risk (vulnerable)
  };

  const getVulnerabilityLabel = (score: number): string => {
    if (score >= 7.5) return 'Low Risk'; // Robust system
    if (score >= 5) return 'Medium Risk'; // Moderate vulnerability
    if (score >= 2.5) return 'High Risk'; // Mostly vulnerable
    return 'Critical Risk'; // Fully vulnerable
  };

  return (
    <div className="space-y-6">
      {/* Main Execution Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assessment Execution</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isRunning ? 'bg-green-100 text-green-800' : 
              isPaused ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {isRunning ? 'Running' : isPaused ? 'Paused' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center space-x-4 mb-6">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Start Assessment
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={onResume}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  <PauseIcon className="w-5 h-5 mr-2" />
                  Pause
                </button>
              )}
              <button
                onClick={onStop}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Stop
              </button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {currentPrompt} of {totalPrompts} prompts
            </span>
            <span className="text-sm text-gray-500">
              {getProgressPercentage().toFixed(1)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* Status Message */}
          {statusMessage && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">
                {statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Time and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">Estimated Time Remaining</div>
              <div className={`font-medium ${localEstimatedTime <= 1 ? 'text-orange-600' : ''}`}>
                {formatTime(localEstimatedTime)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-blue-500" />
            <div>
              <div className="text-sm text-gray-500">Current Category</div>
              <div className="font-medium capitalize">{currentCategory}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {safeguardTriggered ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="text-sm text-gray-500">Safeguard Status</div>
              <div className={`font-medium ${safeguardTriggered ? 'text-green-600' : 'text-red-600'}`}>
                {safeguardTriggered ? 'Triggered' : 'Not Triggered'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Attack Pattern Visualization */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Attack Pattern Monitoring</h3>
          <button
            onClick={() => setShowLiveView(!showLiveView)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showLiveView ? 'Hide' : 'Show'} Live View
          </button>
        </div>

        {showLiveView && (
          <div className="space-y-4">
            {/* Current Prompt Display */}
            {currentPromptText && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Current Prompt</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVulnerabilityColor(vulnerabilityScore)}`}>
                    {getVulnerabilityLabel(vulnerabilityScore)} ({(vulnerabilityScore || 0).toFixed(2)}/10)
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p className="text-sm text-gray-700">{currentPromptText}</p>
                </div>
                {currentResponse && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-700">{currentResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Attack Patterns */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Attack Patterns</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attackPatterns.slice(-5).reverse().map((pattern, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{pattern.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVulnerabilityColor(pattern.vulnerabilityScore)}`}>
                          {(pattern.vulnerabilityScore || 0).toFixed(2)}/10
                        </span>
                        {pattern.safeguardTriggered ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(pattern.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-700 font-medium">Prompt:</p>
                        <p className="text-xs text-gray-600 truncate">{pattern.prompt}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-700 font-medium">Response:</p>
                        <p className="text-xs text-gray-600 truncate">{pattern.response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{currentPrompt}</div>
          <div className="text-sm text-gray-500">Current Prompt</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {attackPatterns.filter(p => p.safeguardTriggered).length}
          </div>
          <div className="text-sm text-gray-500">Safeguards Triggered</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {attackPatterns.length > 0 
              ? (attackPatterns.reduce((sum, p) => sum + p.vulnerabilityScore, 0) / attackPatterns.length).toFixed(2)
              : '0'
            }
          </div>
          <div className="text-sm text-gray-500">Avg Vulnerability</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(attackPatterns.map(p => p.category)).size}
          </div>
          <div className="text-sm text-gray-500">Categories Tested</div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionControls;
