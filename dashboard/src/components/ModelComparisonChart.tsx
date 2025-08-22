'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

import { ModelComparisonData } from '../types';

interface ModelComparisonChartProps {
  models: ModelComparisonData[];
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

const ModelComparisonChart: React.FC<ModelComparisonChartProps> = React.memo(({
  models,
  selectedMetric,
  onMetricChange
}) => {
  // Color palette for different models
  const modelColors = [
    { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgba(59, 130, 246, 1)' }, // Blue
    { bg: 'rgba(16, 185, 129, 0.6)', border: 'rgba(16, 185, 129, 1)' }, // Green
    { bg: 'rgba(245, 158, 11, 0.6)', border: 'rgba(245, 158, 11, 1)' }, // Yellow
    { bg: 'rgba(239, 68, 68, 0.6)', border: 'rgba(239, 68, 68, 1)' }, // Red
    { bg: 'rgba(139, 92, 246, 0.6)', border: 'rgba(139, 92, 246, 1)' }, // Purple
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        onClick: (e: any, legendItem: any, legend: any) => {
          // Custom legend click behavior
          const index = legendItem.index;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            return `Model: ${models[dataIndex]?.model || 'Unknown'}`;
          },
          label: (context: any) => {
            const value = context.parsed.y;
            const model = models[context.dataIndex]?.model || 'Unknown';
            return `${model}: ${value.toFixed(2)}%`;
          }
        }
      },
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index;
          const model = models[dataIndex];
          if (model) {
            alert(`Model: ${model.model}\nProvider: ${model.provider}\nSafeguard Success Rate: ${model.safeguard_success_rate}%`);
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  // Specific options for safeguards chart (0-100%)
  const safeguardOptions = {
    ...chartOptions,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true },
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        suggestedMin: 0,
        suggestedMax: 100,
        grace: 0,
        ticks: {
          stepSize: 10,
          callback: (value: any) => `${value}%`
        },
        title: { display: true, text: 'Safeguard Success Rate (%)' }
      }
    }
  };

  // Specific options for vulnerability chart (0-10)
  const vulnerabilityOptions = {
    ...chartOptions,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true },
      y: {
        beginAtZero: true,
        min: 0,
        max: 10,
        suggestedMin: 0,
        suggestedMax: 10,
        grace: 0,
        ticks: { stepSize: 1 },
        title: { display: true, text: 'Overall Vulnerability Score (0-10)' }
      }
    }
  };

  // Safeguard Success Rate Comparison
  const safeguardChart = {
    labels: models.map(m => `${m.provider}/${m.model}`),
    datasets: [{
      label: 'Safeguard Success Rate (%)',
      data: models.map(m => m.safeguard_success_rate),
      backgroundColor: models.map((_, i) => modelColors[i % modelColors.length].bg),
      borderColor: models.map((_, i) => modelColors[i % modelColors.length].border),
      borderWidth: 2,
    }]
  };

  // Vulnerability Score Comparison
  const vulnerabilityChart = {
    labels: models.map(m => `${m.provider}/${m.model}`),
    datasets: [{
      label: 'Overall Vulnerability Score (0-10)',
      data: models.map(m => m.overall_vulnerability_score),
      backgroundColor: models.map((_, i) => modelColors[i % modelColors.length].bg),
      borderColor: models.map((_, i) => modelColors[i % modelColors.length].border),
      borderWidth: 2,
    }]
  };

  // Response Time & Length Comparison (Multi-axis)
  const performanceChart = {
    labels: models.map(m => `${m.provider}/${m.model}`),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Response Time (s)',
        data: models.map(m => m.average_response_time),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Response Length (words)',
        data: models.map(m => m.average_response_length),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 3,
        fill: false,
        yAxisID: 'y1',
      }
    ]
  };

  // Risk Distribution Stacked Bar Chart
  const riskDistributionChart = {
    labels: models.map(m => `${m.provider}/${m.model}`),
    datasets: [
      {
        label: 'Low Risk',
        data: models.map(m => m.risk_distribution.low),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Medium Risk',
        data: models.map(m => m.risk_distribution.medium),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
      {
        label: 'High Risk',
        data: models.map(m => m.risk_distribution.high),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
      {
        label: 'Critical Risk',
        data: models.map(m => m.risk_distribution.critical),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Radar Chart for Category Performance
  const categories = ['jailbreak', 'bias', 'hallucination', 'privacy', 'manipulation'];
  const radarChart = {
    labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: models.map((model, i) => ({
      label: `${model.provider}/${model.model}`,
      data: categories.map(cat => {
        const categoryData = model.category_breakdown[cat];
        return categoryData ? categoryData.safeguard_success_rate : 0;
      }),
      backgroundColor: modelColors[i % modelColors.length].bg,
      borderColor: modelColors[i % modelColors.length].border,
      borderWidth: 2,
      pointBackgroundColor: modelColors[i % modelColors.length].border,
    }))
  };

  // Advanced Metrics Comparison (if available)
  const advancedMetricsChart = {
    labels: ['BLEU Score', 'Sentiment Bias', 'Consistency'],
    datasets: models.filter(m => m.bleu_score_factual !== undefined || m.sentiment_bias_score !== undefined || m.consistency_score !== undefined).map((model, i) => ({
      label: `${model.provider}/${model.model}`,
      data: [
        model.bleu_score_factual || 0,
        model.sentiment_bias_score || 0,
        model.consistency_score || 0
      ],
      backgroundColor: modelColors[i % modelColors.length].bg,
      borderColor: modelColors[i % modelColors.length].border,
      borderWidth: 2,
      pointBackgroundColor: modelColors[i % modelColors.length].border,
    }))
  };

  const performanceOptions = {
    ...chartOptions,
    scales: {
      x: { beginAtZero: true },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Response Time (seconds)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Response Length (words)' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  const stackedOptions = {
    ...chartOptions,
    scales: {
      x: { stacked: true },
      y: { stacked: true, title: { display: true, text: 'Number of Tests' } }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        onClick: (e: any, legendItem: any, legend: any) => {
          // Custom legend click behavior for radar charts
          const index = legendItem.index;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        }
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return `Model: ${context[0].dataset.label}`;
          },
          label: (context: any) => {
            const labels = ['BLEU Score', 'Sentiment Bias', 'Consistency'];
            const label = labels[context.dataIndex];
            const value = context.parsed.r;
            return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const dataIndex = element.index;
        const model = models[datasetIndex];
        const labels = ['BLEU Score', 'Sentiment Bias', 'Consistency'];
        const label = labels[dataIndex];
        
        // Show detailed metric information
        alert(`Detailed Metric: ${label}\n` +
              `Model: ${model.provider}/${model.model}\n` +
              `Value: ${element.parsed.r.toFixed(2)}\n` +
              `Interpretation: ${getMetricInterpretation(label, element.parsed.r)}`);
      }
    },
    scales: {
      r: {
        angleLines: { display: false },
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: { stepSize: 2 }
      }
    }
  };
  
  const getMetricInterpretation = (metric: string, value: number): string => {
    switch (metric) {
      case 'BLEU Score':
        return value >= 7 ? 'Excellent factual accuracy' : 
               value >= 4 ? 'Good factual accuracy' : 
               'Needs improvement in factual accuracy';
      case 'Sentiment Bias':
        return value <= 3 ? 'Low bias detected' : 
               value <= 6 ? 'Moderate bias detected' : 
               'High bias detected';
      case 'Consistency':
        return value >= 7 ? 'High response consistency' : 
               value >= 4 ? 'Moderate consistency' : 
               'Low consistency detected';
      default:
        return 'Metric analysis available';
    }
  };

  if (models.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg font-medium mb-2">No Model Comparison Data Available</p>
          <p className="text-sm text-gray-400 mb-4">
            Run assessments on multiple models to see authentic comparison charts.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Advanced Metrics Available:</strong><br/>
              • BLEU Score (Factual Accuracy)<br/>
              • Sentiment Bias Detection<br/>
              • Response Consistency Analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Model Comparison Analysis</h2>
        <p className="text-gray-600">
          Comparative analysis across {models.length} LLM models
        </p>
        
        {/* Metric Selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'safeguard', label: 'Safeguards' },
            { key: 'vulnerability', label: 'Vulnerability' },
            { key: 'performance', label: 'Performance' },
            { key: 'risks', label: 'Risk Distribution' },
            { key: 'categories', label: 'Categories' },
            { key: 'advanced', label: 'Advanced Metrics' }
          ].map(metric => (
            <button
              key={metric.key}
              onClick={() => onMetricChange(metric.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metric.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-96 overflow-hidden">
        {selectedMetric === 'safeguard' && (
          <div id="safeguard-comparison-chart" className="h-full">
            <h3 className="text-lg font-semibold mb-4">Safeguard Success Rate Comparison</h3>
            <div className="h-80">
              <Bar data={safeguardChart} options={safeguardOptions} />
            </div>
          </div>
        )}

        {selectedMetric === 'vulnerability' && (
          <div id="vulnerability-comparison-chart" className="h-full">
            <h3 className="text-lg font-semibold mb-4">Vulnerability Score Comparison</h3>
            <div className="h-80">
              <Bar data={vulnerabilityChart} options={vulnerabilityOptions} />
            </div>
          </div>
        )}

        {selectedMetric === 'performance' && (
          <div id="performance-comparison-chart" className="h-full">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics (Response Time vs Length)</h3>
            <div className="h-80">
              <Bar data={performanceChart as any} options={performanceOptions} />
            </div>
          </div>
        )}

        {selectedMetric === 'risks' && (
          <div id="risk-distribution-chart" className="h-full">
            <h3 className="text-lg font-semibold mb-4">Risk Distribution Comparison</h3>
            <div className="h-80">
              <Bar data={riskDistributionChart} options={stackedOptions} />
            </div>
          </div>
        )}

        {selectedMetric === 'categories' && (
          <div id="category-radar-chart" className="h-full">
            <h3 className="text-lg font-semibold mb-4">Category Performance Radar</h3>
            <div className="h-80">
              <Radar data={radarChart} options={radarOptions} />
            </div>
          </div>
        )}

        {selectedMetric === 'advanced' && (
          <div className="h-full">
            <h3 className="text-lg font-semibold mb-4">Advanced Metrics Comparison</h3>
            <div className="h-80">
              {advancedMetricsChart.datasets.length > 0 ? (
                <Radar data={advancedMetricsChart} options={radarOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">Advanced Metrics Not Yet Available</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Run assessments to generate advanced metrics using NLTK and sentence-transformers
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-sm mx-auto">
                      <p className="text-xs text-green-800">
                        <strong>Available Metrics:</strong><br/>
                        • BLEU Score (Factual Accuracy)<br/>
                        • Sentiment Bias Detection<br/>
                        • Response Consistency Analysis
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model, i) => (
            <div key={`${model.provider}-${model.model}`} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center mb-2">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: modelColors[i % modelColors.length].border }}
                />
                <h4 className="font-medium text-gray-900">{model.provider}/{model.model}</h4>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Safeguard Rate:</span>
                  <span className={`font-medium ${
                    model.safeguard_success_rate >= 80 ? 'text-green-600' :
                    model.safeguard_success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {model.safeguard_success_rate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vulnerability:</span>
                  <span className={`font-medium ${
                    model.overall_vulnerability_score >= 7.5 ? 'text-green-600' :
                    model.overall_vulnerability_score >= 5 ? 'text-yellow-600' :
                    model.overall_vulnerability_score >= 2.5 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {model.overall_vulnerability_score.toFixed(2)}/10
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Response:</span>
                  <span className="font-medium text-gray-900">
                    {model.average_response_time.toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ModelComparisonChart;