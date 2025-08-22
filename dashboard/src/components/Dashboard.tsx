'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import PlotlyMetricsChart from './PlotlyMetricsChart';
import PlotlyModelComparisonChart from './PlotlyModelComparisonChart';
import TestResults from './TestResults';
import PDFExport from './PDFExport';
import SetupWizard, { SetupData } from './SetupWizard';
import ExecutionControls from './ExecutionControls';
import ScheduledAssessments from './ScheduledAssessments';
import HistoricalComparison from './HistoricalComparison';
import { AssessmentMetrics, ModelComparisonData, TestResult } from '../types'; // Import types from central file
import { generateAssessmentFindings, getSecurityRecommendation, getPriorityActions } from '../utils/assessmentAnalyzer';

const Dashboard: React.FC = () => {
  const [assessmentStatus, setAssessmentStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentStep, setCurrentStep] = useState<'overview' | 'setup' | 'execution' | 'results'>('overview');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [modelComparisons, setModelComparisons] = useState<ModelComparisonData[]>([]);
  const [metrics, setMetrics] = useState<AssessmentMetrics | null>(null);
  
  // Execution state
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentPromptText, setCurrentPromptText] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [safeguardTriggered, setSafeguardTriggered] = useState(false);
  const [vulnerabilityScore, setVulnerabilityScore] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // WebSocket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);

  // Fetch recent assessments from database
  const fetchRecentAssessments = async () => {
    try {
      console.log('Fetching recent assessments from API...');
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/assessments/historical`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setRecentAssessments(data.assessments || []);
        console.log('Set recent assessments:', data.assessments?.length || 0);
      } else {
        console.error('API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch recent assessments:', error);
    }
  };

  // Fetch assessment results and metrics for a specific assessment
  const fetchAssessmentResults = async (assessmentId: number) => {
    try {
      console.log(`Fetching results for assessment ${assessmentId}...`);
      
      // Fetch test results
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const resultsResponse = await fetch(`${apiUrl}/api/assessments/${assessmentId}/results`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setTestResults(resultsData.results || []);
      }
      
      // Fetch metrics
      const metricsResponse = await fetch(`${apiUrl}/api/assessments/historical`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
        
        // Create model comparison data from metrics
        const modelComparison: ModelComparisonData = {
          model: metricsData.assessment?.model_name || 'Unknown',
          provider: metricsData.assessment?.llm_provider || 'Unknown',
          safeguard_success_rate: metricsData.metrics?.safeguard_success_rate || 0,
          overall_vulnerability_score: metricsData.metrics?.overall_vulnerability_score || 0,
          average_response_time: metricsData.metrics?.average_response_time || 0,
          average_response_length: metricsData.metrics?.average_response_length || 0,
          category_breakdown: metricsData.metrics?.category_breakdown || {},
          risk_distribution: metricsData.metrics?.risk_distribution || {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          },
          strengths: metricsData.metrics?.strengths || [],
          weaknesses: metricsData.metrics?.weaknesses || [],
          potential_flaws: metricsData.metrics?.potential_flaws || []
        };
        
        setModelComparisons([modelComparison]);
        
        console.log('Assessment results loaded successfully');
        setCurrentStep('results');
      }
    } catch (error) {
      console.error('Failed to fetch assessment results:', error);
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const backendUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000';
    const ws = io(backendUrl, {
      autoConnect: false,
      timeout: 30000, // Increase timeout to 30 seconds
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Attempt to connect
    ws.connect();
    
    ws.on('connect', () => {
      console.log('Socket.IO connected');
    });

    ws.on('connect_error', (error) => {
      console.log('WebSocket connection failed:', error.message);
      // Continue without WebSocket - the app should still work
    });

    // Assessment lifecycle events
    ws.on('assessment_started', (message: any) => {
      console.log('Assessment started:', message);
      const data = message.data || message; // Handle wrapped data structure
      setAssessmentStatus('running');
    });

    ws.on('assessment_paused', (data: any) => {
      console.log('Assessment paused:', data);
      setAssessmentStatus('paused');
    });

    ws.on('assessment_resumed', (data: any) => {
      console.log('Assessment resumed:', data);
      setAssessmentStatus('running');
    });

    ws.on('assessment_stopped', (message: any) => {
      console.log('Assessment stopped:', message);
      const data = message.data || message; // Handle wrapped data structure
      setAssessmentStatus('completed');
      setCurrentStep('results');
      // Refresh recent assessments list
      fetchRecentAssessments();
    });

    ws.on('assessment_completed', (message: any) => {
      console.log('Assessment completed:', message);
      const data = message.data || message;
      setAssessmentStatus('completed');
      
      // Update metrics and results from the completion data
      if (data.metrics) {
        setMetrics(data.metrics);
      }
      if (data.results) {
        setTestResults(data.results);
      }
      
      setCurrentStep('results');
      fetchRecentAssessments();
    });

    ws.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      // Check if there's a running assessment that might have completed
      setTimeout(() => {
        console.log('Checking for completed assessments after disconnect...');
        fetchRecentAssessments();
        
        // If we were in the middle of an assessment, try to fetch its results
        if (assessmentStatus === 'running') {
          console.log('Assessment was running when disconnected, checking for completion...');
          // Check the most recent assessment to see if it completed
          const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
          fetch(`${apiUrl}/api/assessments/historical`)
            .then(response => response.json())
            .then(data => {
              const latestAssessment = data.assessments?.[0];
              if (latestAssessment && latestAssessment.status === 'completed') {
                console.log(`Found completed assessment ${latestAssessment.id}, loading results...`);
                fetchAssessmentResults(latestAssessment.id);
              }
            })
            .catch(error => console.error('Error checking for completed assessment:', error));
        }
      }, 2000); // Wait 2 seconds after disconnect to check
    });

    // Test result events
    ws.on('test_result', (message: any) => {
      console.log('Test result:', message);
      const data = message.data || message;
      if (data.result) {
        setTestResults(prev => [...prev, data.result]);
      }
    });

    ws.on('test_completed', (message: any) => {
      console.log('Test completed:', message);
      const data = message.data || message; // Handle wrapped data structure
      // This event provides progress info, not full results
      // Full results come via test_result event
    });

    ws.on('metrics_update', (message: any) => {
      console.log('Metrics update:', message);
      const data = message.data || message; // Handle wrapped data structure
      setMetrics(data.metrics || data);
    });

    ws.on('model_comparison', (message: any) => {
      console.log('Model comparison:', message);
      const data = message.data || message; // Handle wrapped data structure
      setModelComparisons(prev => [...prev, data.comparison || data]);
    });

    ws.on('execution_update', (data: any) => {
      handleExecutionUpdate(data);
    });

    ws.on('execution_update', (message: any) => {
      console.log('Execution update:', message);
      const data = message.data || message; // Handle wrapped data structure
      setCurrentPrompt(data.currentPrompt || data.current_prompt || 0);
      setTotalPrompts(data.totalPrompts || data.total_prompts || 0);
      setCurrentCategory(data.currentCategory || data.current_category || '');
      setCurrentPromptText(data.currentPromptText || data.current_prompt_preview || '');
      setCurrentResponse(data.currentResponse || data.current_response || '');
      setSafeguardTriggered(data.safeguardTriggered || data.safeguard_triggered || false);
      setVulnerabilityScore(data.vulnerabilityScore || data.vulnerability_score || 0);
      
      // Update estimated time based on prompts completed
      if (setupData?.estimatedTimePerPrompt) {
        const currentPromptNumber = data.currentPrompt || data.current_prompt || 0;
        const totalPromptsNumber = data.totalPrompts || data.total_prompts || totalPrompts;
        const promptsRemaining = totalPromptsNumber - currentPromptNumber;
        const newEstimatedTime = Math.max(1, Math.round(setupData.estimatedTimePerPrompt * promptsRemaining));
        setEstimatedTimeRemaining(newEstimatedTime);
      }
      
      // Update status message
      setStatusMessage(data.statusMessage || data.status_message || '');
      console.log('Status:', data.statusMessage || data.status_message);
    });

    // Handle completed test results for live preview
    ws.on('test_completed', (message: any) => {
      console.log('Test completed:', message);
      const data = message.data || message;
      
      // Create a test result object for live preview
      const newTestResult: TestResult = {
        id: Date.now(), // Temporary ID for live display
        category: data.category || '',
        prompt_text: data.prompt || '',
        response_preview: data.response_preview || '',
        vulnerability_score: data.vulnerability_score || 0,
        risk_level: data.risk_level || 'low',
        safeguard_triggered: data.safeguard_triggered || false,
        response_time: data.response_time || 0,
        word_count: data.response_preview ? data.response_preview.split(' ').filter((w: string) => w.trim().length > 0).length : 0,
        timestamp: new Date().toISOString()
      };
      
      // Add to test results for live preview
      setTestResults(prev => [...prev, newTestResult]);
      
      // Update current execution state with completed test data
      setCurrentPromptText(data.prompt || '');
      setCurrentResponse(data.response_preview || '');
      setSafeguardTriggered(data.safeguard_triggered || false);
      setVulnerabilityScore(data.vulnerability_score || 0);
      
      console.log('Added test result to live preview:', newTestResult);
    });

    ws.on('error', (data: any) => {
      console.error('WebSocket error:', data);
    });

    ws.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    setSocket(ws);

    // Fetch recent assessments on component mount
    fetchRecentAssessments();

    return () => {
      ws.close();
    };
  }, []);



  const handleExecutionUpdate = (data: any) => {
    if (data.currentPrompt !== undefined) setCurrentPrompt(data.currentPrompt);
    if (data.totalPrompts !== undefined) setTotalPrompts(data.totalPrompts);
    if (data.currentCategory !== undefined) setCurrentCategory(data.currentCategory);
    if (data.currentPromptText !== undefined) setCurrentPromptText(data.currentPromptText);
    if (data.currentResponse !== undefined) setCurrentResponse(data.currentResponse);
    if (data.safeguardTriggered !== undefined) setSafeguardTriggered(data.safeguardTriggered);
    if (data.vulnerabilityScore !== undefined) setVulnerabilityScore(data.vulnerabilityScore);
    if (data.estimatedTimeRemaining !== undefined) setEstimatedTimeRemaining(data.estimatedTimeRemaining);
  };

  const handleSetupComplete = (data: SetupData) => {
    setSetupData(data);
    setTotalPrompts(data.assessmentConfig.assessmentScope.totalPrompts);
    
    // Calculate initial estimated time from response time multiplied by total prompts
    if (data.estimatedTimePerPrompt) {
      const initialEstimatedTime = Math.round(data.estimatedTimePerPrompt * data.assessmentConfig.assessmentScope.totalPrompts);
      setEstimatedTimeRemaining(initialEstimatedTime);
    }
    
    setCurrentStep('execution');
    
    // Send configuration to backend
    if (socket && socket.connected) {
      socket.emit('start_assessment', data);
    }
  };

  const handleStartAssessment = () => {
    setAssessmentStatus('running');
    setCurrentPrompt(0);
    
    if (socket && socket.connected) {
      socket.emit('start_assessment');
    }
  };

  const handlePauseAssessment = () => {
    setAssessmentStatus('paused');
    
    if (socket && socket.connected) {
      socket.emit('pause_assessment');
    }
  };

  const handleResumeAssessment = () => {
    setAssessmentStatus('running');
    
    if (socket && socket.connected) {
      socket.emit('resume_assessment');
    }
  };

  const handleStopAssessment = () => {
    setAssessmentStatus('completed');
    setCurrentStep('results');
    
    if (socket && socket.connected) {
      socket.emit('stop_assessment');
    }
  };

  const handleBackToOverview = () => {
    setCurrentStep('overview');
    setAssessmentStatus('idle');
    setTestResults([]);
    setModelComparisons([]);
    setMetrics(null);
    setCurrentPrompt(0);
    setCurrentPromptText('');
    setCurrentResponse('');
  };

  const handleBackToSetup = () => {
    setCurrentStep('setup');
    setAssessmentStatus('idle');
    setTestResults([]);
    setModelComparisons([]);
    setMetrics(null);
    setCurrentPrompt(0);
    setCurrentPromptText('');
    setCurrentResponse('');
  };

  const handleNewAssessment = () => {
    setCurrentStep('setup');
    setAssessmentStatus('idle');
    setTestResults([]);
    setModelComparisons([]);
    setMetrics(null);
    setSetupData(null);
  };

  const handleRunScheduledAssessment = (scheduledAssessment: any) => {
    // Convert scheduled assessment to setup data format
    const setupData: SetupData = {
      selectedProvider: scheduledAssessment.provider,
      selectedModel: scheduledAssessment.model,
      apiKeys: { [scheduledAssessment.provider]: 'demo-api-key' }, // In real app, get from secure storage
      assessmentConfig: {
        name: scheduledAssessment.name,
        description: `Scheduled assessment: ${scheduledAssessment.name}`,
        testCategories: scheduledAssessment.categories,
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
    };

    handleSetupComplete(setupData);
  };

  const renderOverviewView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛡️ LLM Red Team Dashboard
          </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive security assessment and monitoring for Large Language Models
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewAssessment}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🚀 New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {metrics && (
          <div className="mb-8">
            <HistoricalComparison 
              currentMetrics={metrics} 
              modelName={setupData?.selectedModel} 
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scheduled Assessments */}
          <div>
            <ScheduledAssessments onRunImmediate={handleRunScheduledAssessment} />
          </div>

          {/* Recent Results Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assessment Results</h3>
            
            {recentAssessments.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700">Total Assessments</div>
                    <div className="text-2xl font-bold text-gray-900">{recentAssessments.length}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700">Completed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {recentAssessments.filter(a => a.status === 'completed').length}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Assessments</h4>
                  <div className="space-y-2">
                    {recentAssessments.slice(0, 5).map((assessment, index) => (
                      <div key={assessment.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-3 ${
                            assessment.status === 'completed' ? 'bg-green-500' : 
                            assessment.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          <div>
                            <span className="text-sm font-medium text-gray-700">{assessment.name}</span>
                            <div className="text-xs text-gray-500">
                              {assessment.llm_provider} • {assessment.model_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium capitalize ${
                            assessment.status === 'completed' ? 'text-green-600' : 
                            assessment.status === 'running' ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {assessment.status}
                          </span>
                          {assessment.overall_score && (
                            <div className="text-xs text-gray-500">
                              Score: {assessment.overall_score.toFixed(1)}/10
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setCurrentStep('results')}
                  className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Full Results →
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No assessments found</p>
                <p className="text-sm">Start your first red team assessment to see results</p>
                <button
                  onClick={handleNewAssessment}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Assessment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleNewAssessment}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <PlayIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium">Quick Assessment</div>
                <div className="text-sm text-gray-600">Run immediate security test</div>
              </div>
            </button>
            
            <button
              onClick={() => setCurrentStep('setup')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <CogIcon className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium">Custom Setup</div>
                <div className="text-sm text-gray-600">Configure detailed parameters</div>
              </div>
            </button>
            
            {testResults.length > 0 && (
              <button
                onClick={() => setCurrentStep('results')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-sm text-gray-600">Analyze recent results</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSetupView = () => (
    <div className="min-h-screen bg-gray-50">
      <SetupWizard
        onSetupComplete={handleSetupComplete}
        onCancel={() => setCurrentStep('setup')}
      />
    </div>
  );

  const renderExecutionView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛡️ Red Team Assessment in Progress
              </h1>
              <p className="text-gray-600 mt-2">
                Testing {setupData?.selectedModel} for vulnerabilities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToOverview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Dashboard
              </button>
              <button
                onClick={handleBackToSetup}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Setup
              </button>
              <button
                onClick={handleNewAssessment}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Execution Controls */}
        <ExecutionControls
          isRunning={assessmentStatus === 'running'}
          isPaused={assessmentStatus === 'paused'}
          currentPrompt={currentPrompt}
          totalPrompts={totalPrompts}
          currentCategory={currentCategory}
          currentPromptText={currentPromptText}
          currentResponse={currentResponse}
          safeguardTriggered={safeguardTriggered}
          vulnerabilityScore={vulnerabilityScore}
          onStart={handleStartAssessment}
          onPause={handlePauseAssessment}
          onResume={handleResumeAssessment}
          onStop={handleStopAssessment}
          estimatedTimeRemaining={estimatedTimeRemaining}
          statusMessage={statusMessage}
        />

        {/* Live Results Preview */}
        {testResults.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Live Results Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testResults.slice(-6).map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {result.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (result.vulnerability_score || 0) >= 7.5 ? 'bg-green-100 text-green-800' :
                      (result.vulnerability_score || 0) >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      (result.vulnerability_score || 0) >= 2.5 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(result.vulnerability_score || 0).toFixed(2)}/10
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-700 font-medium">Prompt:</p>
                      <p className="text-xs text-gray-600 truncate">{result.prompt}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-700 font-medium">Response:</p>
                      <p className="text-xs text-gray-600 truncate">{result.response_preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              </div>
            )}
      </div>
    </div>
  );

  const renderResultsView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
            <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 Assessment Complete
              </h1>
              <p className="text-gray-600 mt-2">
                Results for {setupData?.selectedModel} red team assessment
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToOverview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Dashboard
              </button>
              <button
                onClick={handleNewAssessment}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🚀 New Assessment
              </button>
              <PDFExport
                metrics={metrics}
                modelComparisons={modelComparisons}
                testResults={testResults}
                assessmentStatus={assessmentStatus}
                onExportStart={() => console.log('PDF export started')}
                onExportComplete={() => console.log('PDF export completed')}
              />
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="mb-8">
            <PlotlyMetricsChart metrics={metrics} />
          </div>
        )}

        {/* Model Comparison Charts */}
        <div className="mb-8">
          <PlotlyModelComparisonChart />
        </div>

        {/* Detailed Test Results */}
        {testResults.length > 0 && (
          <div className="mb-8">
            <TestResults results={testResults} />
          </div>
        )}

        {/* Assessment Summary */}
        {metrics && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Assessment Summary
            </h3>
            <div className="prose max-w-none">
              <p className="text-gray-700">
                {metrics.advanced_metrics_note || 'Assessment completed successfully with comprehensive vulnerability analysis.'}
          </p>
        </div>
          </div>
        )}

        {/* Structured Assessment Findings */}
        {metrics && (() => {
          const dynamicFindings = generateAssessmentFindings(testResults, metrics);
          const securityRecommendation = getSecurityRecommendation(metrics);
          const priorityActions = getPriorityActions(dynamicFindings);
          
          return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔍 Structured Assessment Findings
              </h3>
              
              {/* Security Recommendation */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-blue-700 mb-3 flex items-center">
                  🛡️ Security Recommendation
                </h4>
                <div className={`p-4 rounded-lg border ${
                  securityRecommendation.includes('APPROVED') ? 'bg-green-50 border-green-200' :
                  securityRecommendation.includes('CONDITIONAL') ? 'bg-yellow-50 border-yellow-200' :
                  securityRecommendation.includes('CAUTION') ? 'bg-orange-50 border-orange-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-medium ${
                    securityRecommendation.includes('APPROVED') ? 'text-green-800' :
                    securityRecommendation.includes('CONDITIONAL') ? 'text-yellow-800' :
                    securityRecommendation.includes('CAUTION') ? 'text-orange-800' :
                    'text-red-800'
                  }`}>
                    {securityRecommendation}
                  </p>
                </div>
              </div>
              
              {/* Strengths */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-green-700 mb-3 flex items-center">
                  ✅ Strengths
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  {dynamicFindings.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {dynamicFindings.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No specific strengths identified in this assessment.</p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center">
                  ⚠️ Weaknesses
                </h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  {dynamicFindings.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {dynamicFindings.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-600 mr-2">•</span>
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No specific weaknesses identified in this assessment.</p>
                  )}
                </div>
              </div>

              {/* Potential Flaws */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-red-700 mb-3 flex items-center">
                  🚨 Potential Flaws
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  {dynamicFindings.potential_flaws.length > 0 ? (
                    <ul className="space-y-2">
                      {dynamicFindings.potential_flaws.map((flaw, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-gray-700">{flaw}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No critical flaws identified in this assessment.</p>
                  )}
                </div>
              </div>
              
              {/* Priority Actions */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-purple-700 mb-3 flex items-center">
                  📋 Priority Actions
                </h4>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {priorityActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'overview':
        return renderOverviewView();
      case 'setup':
        return renderSetupView();
      case 'execution':
        return renderExecutionView();
      case 'results':
        return renderResultsView();
      default:
        return renderOverviewView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
    </div>
  );
};

export default Dashboard;