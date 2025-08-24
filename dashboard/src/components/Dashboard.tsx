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
  ShieldExclamationIcon,
  SunIcon,
  MoonIcon
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
  const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null);
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
  const [actualResponseTimes, setActualResponseTimes] = useState<number[]>([]);

  // WebSocket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Fetch recent assessments from database
  const fetchRecentAssessments = async () => {
    try {
      console.log('Fetching recent assessments from API...');
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/model-comparisons/assessment-history`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setRecentAssessments(data.history || []);
        console.log('Set recent assessments:', data.history?.length || 0);
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
      
      // Fetch metrics from model comparisons
      const metricsResponse = await fetch(`${apiUrl}/api/model-comparisons`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.success && metricsData.comparisons && metricsData.comparisons.length > 0) {
          // Use the latest model's data as metrics
          const latestModel = metricsData.comparisons[0];
          setMetrics({
            safeguard_success_rate: latestModel.safeguard_success_rate,
            average_response_time: latestModel.average_response_time,
            average_response_length: latestModel.average_response_length,
            overall_vulnerability_score: latestModel.overall_vulnerability_score,
            risk_distribution: latestModel.risk_distribution,
            category_breakdown: latestModel.category_breakdown || {}
          });
        }
        
        // Create model comparison data from API response
        const modelComparisons = metricsData.comparisons.map((model: any): ModelComparisonData => ({
          model: model.model_name || 'Unknown',
          provider: model.provider || 'Unknown',
          safeguard_success_rate: model.safeguard_success_rate || 0,
          overall_vulnerability_score: model.overall_vulnerability_score || 0,
          average_response_time: model.average_response_time || 0,
          average_response_length: model.average_response_length || 0,
          risk_distribution: model.risk_distribution || { low: 0, medium: 0, high: 0, critical: 0 },
          category_breakdown: model.category_breakdown || {},
          bleu_score_factual: model.bleu_score_factual,
          sentiment_bias_score: model.sentiment_bias_score,
          consistency_score: model.consistency_score,
          advanced_metrics_available: model.advanced_metrics_available || false,
          strengths: model.strengths || [],
          weaknesses: model.weaknesses || [],
          potential_flaws: model.potential_flaws || []
        }));
        
        setModelComparisons(modelComparisons);
        
        console.log('Assessment results loaded successfully');
        setCurrentStep('results');
      }
    } catch (error) {
      console.error('Failed to fetch assessment results:', error);
    }
  };
  
  // Theme toggle handler
  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };
  
  // Apply theme to document
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);
  
  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
    }
  }, []);

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

    // Debug: Listen for ALL events
    ws.onAny((eventName: string, ...args: any[]) => {
      console.log('🔥 ANY WebSocket event received:', eventName, args);
    });

    // Test event listener
    ws.on('test_event', (data: any) => {
      console.log('🧪 TEST EVENT RECEIVED:', data);
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
      // Store the assessment ID
      if (data.assessment_id) {
        setCurrentAssessmentId(data.assessment_id);
      }
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

    // Removed duplicate test_completed listener - handled below at line 266

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

    // Handle progress updates from backend
    ws.on('progress_update', (message: any) => {
      console.log('Progress update received:', message);
      const data = message.data || message; // Handle wrapped data structure
      
      setCurrentPrompt(data.current_prompt || 0);
      setTotalPrompts(data.total_prompts || 0);
      setCurrentCategory(data.current_category || '');
      setCurrentPromptText(data.current_prompt_preview || '');
      
      // Update estimated time based on prompts completed
      if (data.total_prompts) {
        const promptsRemaining = data.total_prompts - data.current_prompt;
        
        // Use actual response times if available, otherwise fall back to initial estimate
        setActualResponseTimes(prev => {
          let averageResponseTime;
          
          if (prev.length > 0) {
            // Use average of actual response times
            averageResponseTime = prev.reduce((sum, time) => sum + time, 0) / prev.length;
          } else if (setupData?.estimatedTimePerPrompt) {
            // Fall back to initial connection test time
            averageResponseTime = setupData.estimatedTimePerPrompt;
          } else {
            return prev; // No time data available
          }
          
          const newEstimatedTime = Math.max(1, Math.round(averageResponseTime * promptsRemaining));
          setEstimatedTimeRemaining(newEstimatedTime);
          
          return prev; // Don't modify the array, just use it for calculation
        });
      }
      
      // Update status message with progress percentage
      if (data.progress_percentage !== undefined) {
        setStatusMessage(`Processing prompts: ${data.progress_percentage}% complete`);
      }
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
      const data = message.data || message;
      
      // Only create test result if we have at least the category
      if (!data.category) {
        console.warn('Incomplete test data received from backend - missing category:', data);
        return;
      }
      
      // Log if prompt is missing but continue processing
      if (!data.prompt && !data.prompt_text) {
        console.info('Test result received without prompt text, using fallback:', data);
      }

      // Handle undefined/null vulnerability_score
      let vulnerability_score = data.vulnerability_score;
      if (typeof vulnerability_score !== 'number' || isNaN(vulnerability_score)) {
        vulnerability_score = 0;
      }

      // Generate a truly unique ID to avoid React key conflicts
      const uniqueId = data.test_id || data.prompt_id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a test result object for live preview - using backend data with fallbacks
      const newTestResult: TestResult = {
        id: uniqueId,
        category: data.category,
        prompt: data.prompt || data.prompt_text || data.currentPromptText || `${data.category} test prompt`, // Fallback prompt text
        response_preview: data.response_preview || data.response_text || data.currentResponse || '',
        vulnerability_score: vulnerability_score,
        risk_level: data.risk_level || 'low',
        safeguard_triggered: data.safeguard_triggered || false,
        response_time: parseFloat(data.response_time) || 0, // Ensure it's a number
        word_count: data.word_count || (data.response_preview ? data.response_preview.split(' ').filter((w: string) => w.trim().length > 0).length : 0),
        timestamp: data.timestamp || new Date().toISOString() // Prefer backend timestamp
      };
      
      // Collect actual response times for better time estimation
      if (data.response_time !== undefined && data.response_time > 0) {
        console.log(`✅ Response time received: ${data.response_time}s`);
        
        setActualResponseTimes(prev => {
          const newTimes = [...prev, data.response_time];
          
          // Calculate average response time from actual tests
          const averageResponseTime = newTimes.reduce((sum, time) => sum + time, 0) / newTimes.length;
          
          // Update estimated time remaining using actual average response time
          if (totalPrompts > 0 && currentPrompt >= 0) {
            const promptsRemaining = totalPrompts - currentPrompt;
            const newEstimatedTime = Math.max(1, Math.round(averageResponseTime * promptsRemaining));
            setEstimatedTimeRemaining(newEstimatedTime);
            console.log(`🕒 Updated time estimate: ${newEstimatedTime}s (${promptsRemaining} prompts × ${averageResponseTime.toFixed(2)}s avg)`);
          }
          
          return newTimes;
        });
      }
      
      // Add to test results for live preview (prevent duplicates)
      setTestResults(prev => {
        // Check if this test result already exists (by ID or by unique combination)
        const existingResult = prev.find(existing => 
          existing.id === uniqueId || 
          (existing.category === newTestResult.category && 
           existing.vulnerability_score === newTestResult.vulnerability_score &&
           existing.timestamp === newTestResult.timestamp)
        );
        
        if (existingResult) {
          console.log('Duplicate test result detected, skipping:', uniqueId);
          return prev; // Don't add duplicate
        }
        
        return [...prev, newTestResult];
      });
      
      // Update current execution state with completed test data
      const promptText = data.prompt || data.prompt_text || data.currentPromptText;
      const responseText = data.response_preview || data.response_text || data.currentResponse;
      
      if (promptText) setCurrentPromptText(promptText);
      if (responseText) setCurrentResponse(responseText);
      if (typeof data.safeguard_triggered === 'boolean') setSafeguardTriggered(data.safeguard_triggered);
      if (typeof data.vulnerability_score === 'number') setVulnerabilityScore(data.vulnerability_score);
    });

    // Handle assessment paused event
    ws.on('assessment_paused', (data: any) => {
      console.log('Assessment paused:', data);
      setAssessmentStatus('paused');
      setStatusMessage(data.message || 'Assessment paused');
    });

    // Handle assessment resumed event
    ws.on('assessment_resumed', (data: any) => {
      console.log('Assessment resumed:', data);
      setAssessmentStatus('running');
      setStatusMessage(data.message || 'Assessment resumed');
    });

    // Handle assessment stopped event
    ws.on('assessment_stopped', (data: any) => {
      console.log('Assessment stopped:', data);
      setAssessmentStatus('completed');
      setCurrentStep('results');
      setStatusMessage(data.message || 'Assessment stopped');
    });

    ws.on('error', (data: any) => {
      console.error('WebSocket error:', data);
      
      // Handle resume-specific errors by resetting state
      if (data.message && data.message.includes('Assessment execution has ended') || 
          data.message.includes('already completed') || 
          data.message.includes('has failed') ||
          data.message.includes('was stopped')) {
        
        console.log('Assessment can no longer be resumed, resetting to idle state');
        setAssessmentStatus('idle');
        setCurrentStep('overview');
        setStatusMessage('Assessment ended. Please start a new assessment.');
        
        // Clear assessment data
        setCurrentPrompt(0);
        setCurrentPromptText('');
        setCurrentResponse('');
        setEstimatedTimeRemaining(0);
      }
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
    
    // Set assessment as running immediately when launching
    setAssessmentStatus('running');
    setCurrentStep('execution');
    
    // Send configuration to backend to start assessment
    if (socket && socket.connected) {
      console.log('Launching assessment with data:', data);
      socket.emit('start_assessment', data);
    } else {
      console.error('WebSocket not connected - cannot start assessment');
      setAssessmentStatus('idle');
    }
  };

  const handleStartAssessment = () => {
    console.log('FRONTEND: handleStartAssessment called - THIS SHOULD NOT HAPPEN ON RESUME!');
    console.log('FRONTEND: Current assessment status:', assessmentStatus);
    
    setAssessmentStatus('running');
    setCurrentPrompt(0);
    
    if (socket && socket.connected) {
      console.log('FRONTEND: Emitting start_assessment event');
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
    // Don't optimistically set state - let WebSocket event handle it
    console.log('FRONTEND: handleResumeAssessment called');
    console.log('FRONTEND: Current assessment status:', assessmentStatus);
    console.log('FRONTEND: Socket connected:', socket?.connected);
    
    if (socket && socket.connected) {
      console.log('FRONTEND: About to emit resume_assessment event');
      socket.emit('resume_assessment');
      console.log('FRONTEND: resume_assessment event emitted');
    }
  };

  const handleStopAssessment = () => {
    // Only send the stop request - let WebSocket event handle state changes
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🛡️ LLM Red Team Dashboard
          </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive security assessment and monitoring for Large Language Models
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkTheme ? (
                  <SunIcon className="h-6 w-6 text-yellow-500" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-700" />
                )}
              </button>
              
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Assessment Results</h3>
            
            {recentAssessments.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Assessments</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{recentAssessments.length}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {recentAssessments.filter(a => a.status === 'completed').length}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Assessments</h4>
                  <div className="space-y-2">
                    {recentAssessments.slice(0, 5).map((assessment, index) => (
                      <div key={assessment.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-3 ${
                            assessment.status === 'completed' ? 'bg-green-500' : 
                            assessment.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{assessment.name}</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleNewAssessment}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <PlayIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Quick Assessment</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Run immediate security test</div>
              </div>
            </button>
            
            <button
              onClick={() => setCurrentStep('setup')}
              className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-green-300 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <CogIcon className="h-6 w-6 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Custom Setup</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Configure detailed parameters</div>
              </div>
            </button>
            
            {testResults.length > 0 && (
              <button
                onClick={() => setCurrentStep('results')}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">View Reports</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Analyze recent results</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSetupView = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SetupWizard
        onSetupComplete={handleSetupComplete}
        onCancel={() => setCurrentStep('overview')}
      />
    </div>
  );

  const renderExecutionView = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🛡️ Red Team Assessment in Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Testing {setupData?.selectedModel} for vulnerabilities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToOverview}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Dashboard
              </button>
              <button
                onClick={handleBackToSetup}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Back to Setup
              </button>
              <button
                onClick={handleNewAssessment}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Execution Controls */}
          <div className="xl:col-span-2">
            <ExecutionControls
              isRunning={assessmentStatus === 'running' || assessmentStatus === 'paused'}
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
              testResults={testResults}
            />
          </div>

          {/* Right Column - Test Summary */}
          <div className="space-y-6">
            {/* Recent Test Summary */}
            {testResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{testResults.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Tests Run</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {testResults.filter(r => r.safeguard_triggered).length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Safeguards</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Results Preview */}
        {testResults.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Live Results Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testResults.slice(-6).map((result) => (
                <div key={result.id} className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {result.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (result.vulnerability_score || 0) >= 7.5 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      (result.vulnerability_score || 0) >= 5 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      (result.vulnerability_score || 0) >= 2.5 ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {(result.vulnerability_score || 0).toFixed(2)}/10
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-600 p-2 rounded">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Prompt:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{result.prompt}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 p-2 rounded">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Response:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{result.response_preview}</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
            <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
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
            </div>
          </div>
        </div>

        {/* Report Generation */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📄 Report Generation
          </h3>
          <PDFExport
            metrics={metrics}
            modelComparisons={modelComparisons}
            testResults={testResults}
            assessmentStatus={assessmentStatus}
            assessmentId={currentAssessmentId || undefined}
            onExportStart={() => console.log('PDF export started')}
            onExportComplete={() => console.log('PDF export completed')}
          />
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
                        <li key={`strength-${index}-${strength.slice(0, 20)}`} className="flex items-start">
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

              {/* Critical Weaknesses */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-red-700 mb-3 flex items-center">
                  🚨 Critical Weaknesses
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  {dynamicFindings.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {dynamicFindings.weaknesses.map((weakness, index) => (
                        <li key={`weakness-${index}-${weakness.slice(0, 20)}`} className="flex items-start">
                          <span className="text-red-600 mr-2">•</span>
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No critical weaknesses identified in this assessment.</p>
                  )}
                </div>
              </div>

              {/* Medium-Risk Potential Flaws */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center">
                  ⚠️ Medium-Risk Potential Flaws
                </h4>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  {dynamicFindings.potential_flaws.length > 0 ? (
                    <ul className="space-y-2">
                      {dynamicFindings.potential_flaws.map((flaw, index) => (
                        <li key={`flaw-${index}-${flaw.slice(0, 20)}`} className="flex items-start">
                          <span className="text-orange-600 mr-2">•</span>
                          <span className="text-gray-700">{flaw}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No medium-risk potential flaws identified in this assessment.</p>
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
                      <li key={`action-${index}-${action.slice(0, 20)}`} className="flex items-start">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {renderContent()}
    </div>
  );
};

export default Dashboard;