import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  PlayIcon,
  PauseIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface ScheduledAssessment {
  id: string;
  name: string;
  provider: string;
  model: string;
  categories: string[];
  schedule: string;
  nextRun: Date;
  isActive: boolean;
  lastRun?: Date;
}

interface ScheduledAssessmentsProps {
  onRunImmediate: (assessment: ScheduledAssessment) => void;
}

const ScheduledAssessments: React.FC<ScheduledAssessmentsProps> = ({ onRunImmediate }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const [assessments, setAssessments] = useState<ScheduledAssessment[]>([
    {
      id: '1',
      name: 'Weekly Security Check',
      provider: 'openai',
      model: 'gpt-4',
      categories: ['jailbreak', 'bias'],
      schedule: 'Weekly',
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    categories: ['jailbreak'],
    schedule: 'weekly'
  });

  const handleToggleActive = (id: string) => {
    setAssessments(prev => prev.map(assessment => 
      assessment.id === id 
        ? { ...assessment, isActive: !assessment.isActive }
        : assessment
    ));
  };

  const handleDelete = (id: string) => {
    setAssessments(prev => prev.filter(assessment => assessment.id !== id));
  };

  const handleCreate = () => {
    const newId = (assessments.length + 1).toString();
    const nextRun = new Date();
    
    // Calculate next run based on schedule
    switch (newAssessment.schedule) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    setAssessments(prev => [...prev, {
      id: newId,
      name: newAssessment.name,
      provider: newAssessment.provider,
      model: newAssessment.model,
      categories: newAssessment.categories,
      schedule: newAssessment.schedule.charAt(0).toUpperCase() + newAssessment.schedule.slice(1),
      nextRun,
      isActive: true
    }]);

    setShowCreateForm(false);
    setNewAssessment({
      name: '',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      categories: ['jailbreak'],
      schedule: 'weekly'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Assessments</h3>
          <p className="text-sm text-gray-600">Automated recurring security tests</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Schedule New
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">Create Scheduled Assessment</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Name
              </label>
              <input
                type="text"
                value={newAssessment.name}
                onChange={(e) => setNewAssessment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Weekly Security Check"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider & Model
              </label>
              <select
                value={`${newAssessment.provider}-${newAssessment.model}`}
                onChange={(e) => {
                  const [provider, model] = e.target.value.split('-');
                  setNewAssessment(prev => ({ ...prev, provider, model }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai-gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
                <option value="openai-gpt-4">OpenAI GPT-4</option>
                <option value="anthropic-claude-3-haiku">Claude 3 Haiku</option>
                <option value="anthropic-claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {['jailbreak', 'bias', 'hallucination', 'privacy', 'manipulation'].map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAssessment.categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewAssessment(prev => ({ 
                            ...prev, 
                            categories: [...prev.categories, category] 
                          }));
                        } else {
                          setNewAssessment(prev => ({ 
                            ...prev, 
                            categories: prev.categories.filter(c => c !== category) 
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{category}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <select
                value={newAssessment.schedule}
                onChange={(e) => setNewAssessment(prev => ({ ...prev, schedule: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newAssessment.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Create Schedule
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-md font-medium text-gray-900">{assessment.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assessment.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {assessment.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium">Model:</span>
                    <span className="ml-2">{assessment.provider} {assessment.model}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Schedule:</span>
                    <span className="ml-2">{assessment.schedule}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium">Next Run:</span>
                    <span className="ml-2">{mounted ? assessment.nextRun.toLocaleDateString('en-US') : '...'}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Categories:</span>
                  <span className="ml-2">{assessment.categories.join(', ')}</span>
                </div>
                
                {assessment.lastRun && (
                  <div className="mt-2 text-sm text-gray-500">
                    Last run: {mounted ? assessment.lastRun.toLocaleString('en-US') : '...'}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onRunImmediate(assessment)}
                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Run Now"
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleToggleActive(assessment.id)}
                  className={`p-2 transition-colors ${
                    assessment.isActive 
                      ? 'text-orange-600 hover:text-orange-800' 
                      : 'text-green-600 hover:text-green-800'
                  }`}
                  title={assessment.isActive ? 'Pause' : 'Resume'}
                >
                  {assessment.isActive ? 
                    <PauseIcon className="h-4 w-4" /> : 
                    <PlayIcon className="h-4 w-4" />
                  }
                </button>
                
                <button
                  onClick={() => handleDelete(assessment.id)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {assessments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No scheduled assessments yet</p>
            <p className="text-sm">Create your first scheduled assessment to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledAssessments;