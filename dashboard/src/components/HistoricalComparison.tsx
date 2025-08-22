import React, { useState, useEffect } from 'react';
import { 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ArrowTrendingDownIcon as TrendingDownIcon,
  MinusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface HistoricalData {
  date: string;
  modelName: string;
  safeguardSuccessRate: number;
  overallVulnerabilityScore: number;
  highRiskFindings: number;
  totalTests: number;
  categories: string[];
}

interface HistoricalComparisonProps {
  currentMetrics?: {
    safeguard_success_rate: number;
    overall_vulnerability_score: number;
    high_risk_findings?: number;
    total_tests?: number;
  };
  modelName?: string;
}

const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({ 
  currentMetrics, 
  modelName = 'gpt-3.5-turbo' 
}) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from backend API
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/assessments/historical`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data.assessments.map(transformAssessmentData));
      } else {
        // Fallback to mock data for demo
        setHistoricalData([
          {
            date: '2024-01-15',
            modelName: 'gpt-3.5-turbo',
            safeguardSuccessRate: 72.5,
            overallVulnerabilityScore: 5.8,
            highRiskFindings: 8,
            totalTests: 40,
            categories: ['jailbreak', 'bias']
          },
          {
            date: '2024-02-15',
            modelName: 'gpt-3.5-turbo',
            safeguardSuccessRate: 78.2,
            overallVulnerabilityScore: 5.2,
            highRiskFindings: 6,
            totalTests: 45,
            categories: ['jailbreak', 'bias', 'hallucination']
          },
          {
            date: new Date().toISOString().split('T')[0], // Today's date
            modelName: modelName || 'gpt-3.5-turbo',
            safeguardSuccessRate: currentMetrics?.safeguard_success_rate || 81.0,
            overallVulnerabilityScore: currentMetrics?.overall_vulnerability_score || 4.9,
            highRiskFindings: currentMetrics?.high_risk_findings || 5,
            totalTests: currentMetrics?.total_tests || 50,
            categories: ['jailbreak', 'bias', 'hallucination']
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      // Use mock data as fallback
      setHistoricalData([
        {
          date: new Date().toISOString().split('T')[0],
          modelName: modelName || 'Current Assessment',
          safeguardSuccessRate: currentMetrics?.safeguard_success_rate || 75.0,
          overallVulnerabilityScore: currentMetrics?.overall_vulnerability_score || 5.5,
          highRiskFindings: currentMetrics?.high_risk_findings || 3,
          totalTests: currentMetrics?.total_tests || 20,
          categories: ['jailbreak', 'bias']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const transformAssessmentData = (assessment: any): HistoricalData => {
    return {
      date: assessment.created_at.split('T')[0],
      modelName: `${assessment.provider} ${assessment.model}`,
      safeguardSuccessRate: assessment.metrics?.safeguard_success_rate || 0,
      overallVulnerabilityScore: assessment.metrics?.overall_vulnerability_score || 0,
      highRiskFindings: assessment.metrics?.high_risk_findings || 0,
      totalTests: assessment.results_count || 0,
      categories: assessment.categories.split(',')
    };
  };

  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');

  const getFilteredData = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeframe) {
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return historicalData;
    }
    
    return historicalData.filter(data => new Date(data.date) >= cutoffDate);
  };

  const getTrendIcon = (current: number, previous: number, higherIsBetter: boolean = true) => {
    const isImprovement = higherIsBetter ? current > previous : current < previous;
    const change = Math.abs(current - previous);
    
    if (change < 0.1) {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }
    
    if (isImprovement) {
      return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
    } else {
      return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (current: number, previous: number, higherIsBetter: boolean = true) => {
    const isImprovement = higherIsBetter ? current > previous : current < previous;
    const change = Math.abs(current - previous);
    
    if (change < 0.1) return 'text-gray-500';
    return isImprovement ? 'text-green-600' : 'text-red-600';
  };

  const filteredData = getFilteredData();
  const latestHistorical = filteredData[filteredData.length - 1];
  const previousHistorical = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;

  // Use current metrics if available, otherwise use latest historical
  const current = currentMetrics ? {
    safeguardSuccessRate: currentMetrics.safeguard_success_rate,
    overallVulnerabilityScore: currentMetrics.overall_vulnerability_score,
    highRiskFindings: currentMetrics.high_risk_findings || 0,
    totalTests: currentMetrics.total_tests || 0
  } : latestHistorical;

  const previous = previousHistorical;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Historical Comparison
          </h3>
          <p className="text-sm text-gray-600">Track security improvements over time</p>
        </div>
        
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {current && previous ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Safeguard Success Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Safeguard Success</h4>
              {getTrendIcon(current.safeguardSuccessRate, previous.safeguardSuccessRate, true)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {current.safeguardSuccessRate.toFixed(1)}%
            </div>
            <div className={`text-sm ${getChangeColor(current.safeguardSuccessRate, previous.safeguardSuccessRate, true)}`}>
              {getChangePercentage(current.safeguardSuccessRate, previous.safeguardSuccessRate) > 0 ? '+' : ''}
              {getChangePercentage(current.safeguardSuccessRate, previous.safeguardSuccessRate).toFixed(1)}%
              <span className="text-gray-500 ml-1">vs previous</span>
            </div>
          </div>

          {/* Vulnerability Score */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Vulnerability Score</h4>
              {getTrendIcon(current.overallVulnerabilityScore, previous.overallVulnerabilityScore, false)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {current.overallVulnerabilityScore.toFixed(1)}/10
            </div>
            <div className={`text-sm ${getChangeColor(current.overallVulnerabilityScore, previous.overallVulnerabilityScore, false)}`}>
              {getChangePercentage(current.overallVulnerabilityScore, previous.overallVulnerabilityScore) > 0 ? '+' : ''}
              {getChangePercentage(current.overallVulnerabilityScore, previous.overallVulnerabilityScore).toFixed(1)}%
              <span className="text-gray-500 ml-1">vs previous</span>
            </div>
          </div>

          {/* High Risk Findings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">High Risk Findings</h4>
              {getTrendIcon(current.highRiskFindings, previous.highRiskFindings, false)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {current.highRiskFindings}
            </div>
            <div className={`text-sm ${getChangeColor(current.highRiskFindings, previous.highRiskFindings, false)}`}>
              {current.highRiskFindings - previous.highRiskFindings > 0 ? '+' : ''}
              {current.highRiskFindings - previous.highRiskFindings}
              <span className="text-gray-500 ml-1">vs previous</span>
            </div>
          </div>

          {/* Total Tests */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Tests Completed</h4>
              {getTrendIcon(current.totalTests, previous.totalTests, true)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {current.totalTests}
            </div>
            <div className={`text-sm ${getChangeColor(current.totalTests, previous.totalTests, true)}`}>
              {current.totalTests - previous.totalTests > 0 ? '+' : ''}
              {current.totalTests - previous.totalTests}
              <span className="text-gray-500 ml-1">vs previous</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No historical data available</p>
          <p className="text-sm">Complete more assessments to see trends over time</p>
        </div>
      )}

      {/* Historical Timeline */}
      {filteredData.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Assessment Timeline</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safeguard Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vulnerability Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    High Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((data, index) => (
                  <tr key={index} className={index === filteredData.length - 1 ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(data.date).toLocaleDateString('en-US')}
                      {index === filteredData.length - 1 && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">(Latest)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.safeguardSuccessRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.overallVulnerabilityScore.toFixed(1)}/10
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.highRiskFindings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.categories.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalComparison;