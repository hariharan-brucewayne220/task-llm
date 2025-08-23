import React from 'react';
import { AssessmentStatus } from '../types';

interface ProgressIndicatorProps {
  assessmentStatus: AssessmentStatus;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ assessmentStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return 'RUNNING';
      case 'completed': return 'COMPLETE';
      case 'error': return 'ERROR';
      default: return 'IDLE';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Assessment Progress</h2>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(assessmentStatus.status)}`}>
          {getStatusIcon(assessmentStatus.status)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Testing Progress
          </span>
          <span className="text-sm text-gray-500">
            {assessmentStatus.current_prompt}/{assessmentStatus.total_prompts} prompts
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${assessmentStatus.progress_percent}%` }}
          ></div>
        </div>
        
        <div className="text-center mt-1 text-sm text-gray-600">
          {assessmentStatus.progress_percent.toFixed(1)}%
        </div>
      </div>

      {/* Categories and Details */}
      {assessmentStatus.categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Categories</p>
            <div className="flex flex-wrap gap-1">
              {assessmentStatus.categories.map((category, index) => (
                <span 
                  key={`category-${category}-${index}`}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {assessmentStatus.start_time && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Started</p>
              <p className="text-sm text-gray-600">
                {new Date(assessmentStatus.start_time).toLocaleTimeString()}
              </p>
            </div>
          )}

          {assessmentStatus.status === 'running' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Estimated Time</p>
              <p className="text-sm text-gray-600">
                ~{Math.round((assessmentStatus.total_prompts - assessmentStatus.current_prompt) * 0.5 / 60)} min remaining
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;