import React from 'react';
import { AssessmentMetrics } from '../types';

interface MetricsChartProps {
  metrics: AssessmentMetrics;
}

const MetricsChart: React.FC<MetricsChartProps> = React.memo(({ metrics }) => {
  const riskColors = {
    low: { bg: 'bg-green-500', text: 'text-green-600' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    high: { bg: 'bg-orange-500', text: 'text-orange-600' },
    critical: { bg: 'bg-red-500', text: 'text-red-600' }
  };

  const getRiskPercentage = (count: number) => {
    const total = Object.values(metrics.risk_distribution || {}).reduce((sum, val) => sum + val, 0);
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div id="metrics-chart" className="bg-white rounded-lg shadow-sm border p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Key Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="space-y-4">
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Safeguard Success Rate</span>
              <span className={`text-lg font-bold ${
                (metrics.safeguard_success_rate || 0) >= 80 ? 'text-green-600' :
                (metrics.safeguard_success_rate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(metrics.safeguard_success_rate || 0).toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Overall Vulnerability Score</span>
              <span className={`text-lg font-bold ${
                (metrics.overall_vulnerability_score || 0) >= 7.5 ? 'text-green-600' :
                (metrics.overall_vulnerability_score || 0) >= 5 ? 'text-yellow-600' :
                (metrics.overall_vulnerability_score || 0) >= 2.5 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {(metrics.overall_vulnerability_score || 0).toFixed(2)}/10
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Average Response Time</span>
              <span className="text-lg font-bold text-gray-900">
                {(metrics.average_response_time || 0).toFixed(2)}s
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Average Response Length</span>
              <span className="text-lg font-bold text-gray-900">
                {(metrics.average_response_length || 0).toFixed(0)} words
              </span>
            </div>
            
          </div>
        </div>

        {/* Risk Distribution */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          
          {/* Visual Risk Bar */}
          <div className="mb-4">
            <div className="flex h-6 rounded-lg overflow-hidden">
              {Object.entries(metrics.risk_distribution || {}).map(([level, count]) => {
                const percentage = getRiskPercentage(count);
                return percentage > 0 ? (
                  <div
                    key={level}
                    className={riskColors[level as keyof typeof riskColors].bg}
                    style={{ width: `${percentage}%` }}
                    title={`${level}: ${count} (${percentage.toFixed(1)}%)`}
                  />
                ) : null;
              })}
            </div>
          </div>

          {/* Risk Details */}
          <div className="space-y-2">
            {Object.entries(metrics.risk_distribution || {}).map(([level, count]) => (
              <div key={level} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${riskColors[level as keyof typeof riskColors].bg}`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{level}</span>
                </div>
                <span className={`text-sm font-bold ${riskColors[level as keyof typeof riskColors].text}`}>
                  {count} ({getRiskPercentage(count).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Category Breakdown */}
      {Object.keys(metrics.category_breakdown || {}).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(metrics.category_breakdown || {}).map(([category, data]) => (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 capitalize mb-2">{category}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tests:</span>
                    <span className="font-medium">{data.total_tests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Safeguard Rate:</span>
                    <span className={`font-medium ${
                      (data.safeguard_success_rate || 0) >= 80 ? 'text-green-600' :
                      (data.safeguard_success_rate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(data.safeguard_success_rate || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Score:</span>
                    <span className="font-medium">{(data.avg_vulnerability_score || 0).toFixed(2)}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Metrics */}
      {metrics.advanced_metrics_available && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Advanced Metrics
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal">
              ✅ NLTK + Transformers Active
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.bleu_score_factual !== undefined && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">BLEU Score (Factual)</h4>
                <div className="text-2xl font-bold text-blue-800">
                  {metrics.bleu_score_factual.toFixed(2)}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Measures factual accuracy in responses
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Scale:</strong> 0-10 (Higher = More Accurate)
                </div>
              </div>
            )}

            {metrics.sentiment_bias_score !== undefined && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Sentiment Bias</h4>
                <div className="text-2xl font-bold text-purple-800">
                  {metrics.sentiment_bias_score.toFixed(2)}
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  VADER sentiment analysis for bias detection
                </p>
                <div className="mt-2 text-xs text-purple-600">
                  <strong>Scale:</strong> 0-10 (Lower = Less Biased)
                </div>
              </div>
            )}

            {metrics.consistency_score !== undefined && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Consistency Score</h4>
                <div className="text-2xl font-bold text-green-800">
                  {metrics.consistency_score.toFixed(2)}
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Response consistency via sentence embeddings
                </p>
                <div className="mt-2 text-xs text-green-600">
                  <strong>Scale:</strong> 0-10 (Higher = More Consistent)
                </div>
              </div>
            )}
          </div>

          {metrics.advanced_metrics_note && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>✅ Advanced Analysis Active:</strong> {metrics.advanced_metrics_note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Metrics Error */}
      {metrics.advanced_metrics_available === false && metrics.advanced_metrics_error && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Advanced Metrics Unavailable
            </h3>
            <p className="text-sm text-yellow-800">
              Install packages for enhanced analysis: <code className="bg-yellow-100 px-1 rounded">pip install nltk sentence-transformers</code>
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Error: {metrics.advanced_metrics_error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default MetricsChart;