'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PlotData, Config, Layout } from 'plotly.js';
import { RISK_COLORS } from '../utils/vulnerabilityUtils';

// Dynamic import to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ModelComparisonData {
  id: number;
  model_name: string;
  provider: string;
  overall_vulnerability_score: number;
  safeguard_success_rate: number;
  average_response_time: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  category_breakdown: Record<string, any>;
  updated_at: string;
}

interface PlotlyModelComparisonChartProps {
  title?: string;
  chartId?: string;
}

const PlotlyModelComparisonChart: React.FC<PlotlyModelComparisonChartProps> = ({ 
  title = 'Model Comparison',
  chartId = 'model-comparison-chart'
}) => {
  const [isClient, setIsClient] = useState(false);
  const [modelData, setModelData] = useState<ModelComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/model-comparisons/chart-data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convert chart data to model records for display
        const models: ModelComparisonData[] = data.bar_chart.models.map((modelLabel: string, index: number) => {
          const [model_name, provider] = modelLabel.split(' (');
          return {
            id: index,
            model_name: model_name,
            provider: provider?.replace(')', '') || 'Unknown',
            overall_vulnerability_score: data.bar_chart.vulnerability_scores[index] || 0,
            safeguard_success_rate: data.bar_chart.safeguard_rates[index] || 0,
            average_response_time: data.bar_chart.response_times[index] || 0,
            risk_distribution: {
              low: data.risk_distribution.low[index] || 0,
              medium: data.risk_distribution.medium[index] || 0,
              high: data.risk_distribution.high[index] || 0,
              critical: data.risk_distribution.critical[index] || 0,
            },
            category_breakdown: {},
            updated_at: new Date().toISOString()
          };
        });
        
        setModelData(models);
      } else {
        setError(data.error || 'Failed to fetch model data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch model data');
      console.error('Error fetching model data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading chart...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading model comparison data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || modelData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {error ? `Error: ${error}` : 'No model comparison data available. Run assessments to see comparisons.'}
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const modelLabels = modelData.map(m => `${m.model_name} (${m.provider})`);
  const vulnerabilityScores = modelData.map(m => m.overall_vulnerability_score);
  const safeguardRates = modelData.map(m => m.safeguard_success_rate);
  const responseTimes = modelData.map(m => m.average_response_time);

  // Multi-metric Comparison Bar Chart
  const multiMetricData: PlotData[] = [
    {
      x: modelLabels,
      y: vulnerabilityScores,
      type: 'bar',
      name: 'Vulnerability Score',
      marker: {
        color: 'rgba(59, 130, 246, 0.8)',
        line: { color: 'rgba(59, 130, 246, 1)', width: 2 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'Vulnerability Score: %{y:.2f}/10<br>' +
                     '<extra></extra>',
      yaxis: 'y'
    },
    {
      x: modelLabels,
      y: safeguardRates,
      type: 'bar',
      name: 'Safeguard Rate',
      marker: {
        color: 'rgba(16, 185, 129, 0.8)',
        line: { color: 'rgba(16, 185, 129, 1)', width: 2 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'Safeguard Rate: %{y:.1f}%<br>' +
                     '<extra></extra>',
      yaxis: 'y2'
    }
  ];

  const multiMetricLayout: Partial<Layout> = {
    title: {
      text: 'Model Performance Comparison',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 100, l: 60, r: 60 },
    xaxis: {
      title: 'Models',
      tickangle: -45
    },
    yaxis: {
      title: 'Vulnerability Score (0-10)',
      side: 'left',
      range: [0, 10]
    },
    yaxis2: {
      title: 'Safeguard Success Rate (%)',
      side: 'right',
      overlaying: 'y',
      range: [0, 100]
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'center',
      x: 0.5
    },
    barmode: 'group'
  };

  // Risk Distribution Stacked Bar Chart
  const riskStackedData: PlotData[] = [
    {
      x: modelLabels,
      y: modelData.map(m => m.risk_distribution.low),
      type: 'bar',
      name: 'Low Risk',
      marker: { color: '#22c55e' },
      hovertemplate: '<b>%{x}</b><br>Low Risk: %{y} tests<extra></extra>'
    },
    {
      x: modelLabels,
      y: modelData.map(m => m.risk_distribution.medium),
      type: 'bar',
      name: 'Medium Risk',
      marker: { color: '#eab308' },
      hovertemplate: '<b>%{x}</b><br>Medium Risk: %{y} tests<extra></extra>'
    },
    {
      x: modelLabels,
      y: modelData.map(m => m.risk_distribution.high),
      type: 'bar',
      name: 'High Risk',
      marker: { color: '#f97316' },
      hovertemplate: '<b>%{x}</b><br>High Risk: %{y} tests<extra></extra>'
    },
    {
      x: modelLabels,
      y: modelData.map(m => m.risk_distribution.critical),
      type: 'bar',
      name: 'Critical Risk',
      marker: { color: '#ef4444' },
      hovertemplate: '<b>%{x}</b><br>Critical Risk: %{y} tests<extra></extra>'
    }
  ];

  const riskStackedLayout: Partial<Layout> = {
    title: {
      text: 'Risk Distribution Comparison',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 100, l: 60, r: 60 },
    xaxis: {
      title: 'Models',
      tickangle: -45
    },
    yaxis: {
      title: 'Number of Tests'
    },
    barmode: 'stack',
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'center',
      x: 0.5
    }
  };

  // Response Time Scatter Plot
  const scatterData: PlotData[] = [{
    x: vulnerabilityScores,
    y: safeguardRates,
    mode: 'markers+text',
    type: 'scatter',
    text: modelData.map(m => m.model_name),
    textposition: 'top center',
    marker: {
      size: responseTimes.map(t => Math.max(8, Math.min(30, t * 3))), // Size based on response time
      color: responseTimes,
      colorscale: 'Viridis',
      colorbar: {
        title: 'Response Time (s)',
        thickness: 15,
        len: 0.5
      },
      line: { width: 2, color: 'white' }
    },
    hovertemplate: '<b>%{text}</b><br>' +
                   'Vulnerability Score: %{x:.2f}<br>' +
                   'Safeguard Rate: %{y:.1f}%<br>' +
                   'Response Time: %{marker.color:.2f}s<br>' +
                   '<extra></extra>'
  }];

  const scatterLayout: Partial<Layout> = {
    title: {
      text: 'Model Performance Matrix',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 50, l: 60, r: 100 },
    xaxis: {
      title: 'Vulnerability Score (0-10)',
      range: [0, 10]
    },
    yaxis: {
      title: 'Safeguard Success Rate (%)',
      range: [0, 100]
    },
    showlegend: false
  };

  const config: Partial<Config> = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={fetchModelData}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="space-y-8">
        {/* Multi-metric Comparison */}
        <div id={`${chartId}-multi-metric`}>
          <Plot
            data={multiMetricData}
            layout={multiMetricLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Risk Distribution */}
        <div id={`${chartId}-risk-distribution`}>
          <Plot
            data={riskStackedData}
            layout={riskStackedLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Performance Matrix */}
        <div id={`${chartId}-scatter`}>
          <Plot
            data={scatterData}
            layout={scatterLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vulnerability Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Safeguard Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modelData.map((model, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {model.model_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {model.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.overall_vulnerability_score.toFixed(2)}/10
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.safeguard_success_rate.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.average_response_time.toFixed(2)}s
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(model.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlotlyModelComparisonChart;