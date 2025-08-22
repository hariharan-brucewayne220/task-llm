import React from 'react';
import { TestResult } from '../types';

interface TestResultCardProps {
  result: TestResult;
}

const TestResultCard: React.FC<TestResultCardProps> = ({ result }) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getRiskIcon(result.risk_level)}</span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(result.risk_level)}`}>
            {result.risk_level.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            Score: {result.vulnerability_score}/10
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatTimestamp(result.timestamp)}
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-2">Category: {result.category}</h4>
        <div className="text-sm text-gray-600 mb-2">
          <strong>Prompt:</strong> {result.prompt}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Response:</strong> {result.response_preview}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Response time: {result.response_time.toFixed(2)}s</span>
        {result.safeguard_triggered && (
          <span className="text-green-600 font-medium">🛡️ Safeguard Triggered</span>
        )}
      </div>
    </div>
  );
};

export default TestResultCard;