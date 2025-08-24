'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RISK_COLORS } from '../utils/vulnerabilityUtils';

// Types for Plotly
interface PlotData {
  x?: any[];
  y?: any[];
  z?: any[];
  type?: string;
  mode?: string;
  name?: string;
  marker?: any;
  line?: any;
  fill?: string;
  fillcolor?: string;
  text?: string | string[];
  textposition?: string;
  hovertemplate?: string;
  values?: number[];
  labels?: string[];
  hole?: number;
  showlegend?: boolean;
  [key: string]: any;
}

interface Layout {
  title?: string | { text: string; [key: string]: any };
  xaxis?: any;
  yaxis?: any;
  showlegend?: boolean;
  margin?: { l?: number; r?: number; t?: number; b?: number };
  paper_bgcolor?: string;
  plot_bgcolor?: string;
  font?: any;
  height?: number;
  width?: number;
  [key: string]: any;
}

interface Config {
  displayModeBar?: boolean;
  responsive?: boolean;
  [key: string]: any;
}

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
  const [selectedMetric, setSelectedMetric] = useState<string>('vulnerability_score');

  useEffect(() => {
    setIsClient(true);
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/model-comparisons/chart-data`);
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          console.info('Model comparison endpoint not found - backend may not be running or feature not implemented');
          setError('Model comparison feature not available - start an assessment to generate comparison data');
          return;
        }
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
        
        // Filter out claude-3-sonnet as it's an outlier
        const filteredModels = models.filter(model => 
          !model.model_name.toLowerCase().includes('claude-3-sonnet')
        );
        setModelData(filteredModels);
      } else {
        setError(data.error || 'Failed to fetch model data');
      }
    } catch (err) {
      // Better error handling for network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Backend server not reachable - please ensure the backend is running on port 5000');
        console.error('Backend connection failed - check if server is running:', err);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch model data');
        console.error('Error fetching model data:', err);
      }
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

  if (error) {
    // Check if this is a backend unavailable error (more user-friendly)
    const isBackendUnavailable = error.includes('not available') || error.includes('not reachable');
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            {isBackendUnavailable ? (
              <>
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <p className="text-lg font-medium text-gray-600 mb-2">Model Comparison Not Available</p>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  {error}
                </p>
                <div className="text-xs text-gray-400 mb-4">
                  This feature requires completed assessments and a running backend service
                </div>
              </>
            ) : (
              <>
                <p className="text-red-600 mb-2">Error loading model comparison data</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
              </>
            )}
            <button 
              onClick={fetchModelData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {isBackendUnavailable ? 'Check Again' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (modelData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p className="text-lg font-medium text-gray-600 mb-2">No Model Comparisons Yet</p>
            <p className="text-sm text-gray-500">
              Run assessments on multiple models to see comparison charts
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Available metrics for dropdown selection
  const availableMetrics = [
    { value: 'vulnerability_score', label: 'Vulnerability Score', unit: '/10', color: 'rgba(239, 68, 68, 0.8)' },
    { value: 'safeguard_rate', label: 'Safeguard Success Rate', unit: '%', color: 'rgba(34, 197, 94, 0.8)' },
    { value: 'response_time', label: 'Average Response Time', unit: 's', color: 'rgba(59, 130, 246, 0.8)' },
    { value: 'total_tests', label: 'Total Tests Run', unit: '', color: 'rgba(147, 51, 234, 0.8)' }
  ];

  // Prepare data for charts
  const modelLabels = modelData.map(m => m.model_name);
  const vulnerabilityScores = modelData.map(m => m.overall_vulnerability_score);
  const safeguardRates = modelData.map(m => m.safeguard_success_rate);
  const responseTimes = modelData.map(m => m.average_response_time);
  const totalTests = modelData.map(m => 
    m.risk_distribution.low + m.risk_distribution.medium + 
    m.risk_distribution.high + m.risk_distribution.critical
  );

  // Get data for selected metric
  const getMetricData = (metric: string) => {
    switch (metric) {
      case 'vulnerability_score': return vulnerabilityScores;
      case 'safeguard_rate': return safeguardRates;
      case 'response_time': return responseTimes;
      case 'total_tests': return totalTests;
      default: return vulnerabilityScores;
    }
  };

  const selectedMetricConfig = availableMetrics.find(m => m.value === selectedMetric) || availableMetrics[0];
  const selectedMetricData = getMetricData(selectedMetric);

  // Dynamic Bar Chart for Selected Metric
  const barChartData: PlotData[] = [{
    x: modelLabels,
    y: selectedMetricData,
    type: 'bar',
    name: selectedMetricConfig.label,
    marker: {
      color: selectedMetricConfig.color,
      line: { color: selectedMetricConfig.color.replace('0.8', '1'), width: 2 }
    },
    hovertemplate: '<b>%{x}</b><br>' +
                   `${selectedMetricConfig.label}: %{y:.2f}${selectedMetricConfig.unit}<br>` +
                   '<extra></extra>'
  }];

  const barChartLayout: Partial<Layout> = {
    title: {
      text: `Model Comparison: ${selectedMetricConfig.label}`,
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 100, l: 60, r: 60 },
    xaxis: {
      title: {
        text: 'Models',
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      tickangle: -45,
      tickfont: { size: 12 }
    },
    yaxis: {
      title: {
        text: `${selectedMetricConfig.label}${selectedMetricConfig.unit ? ` (${selectedMetricConfig.unit})` : ''}`,
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      range: selectedMetric === 'vulnerability_score' ? [0, 10] : 
             selectedMetric === 'safeguard_rate' ? [0, 100] : undefined,
      tickfont: { size: 12 }
    },
    showlegend: false
  };

  // Radial Chart (Polar) for Risk Distribution
  const radialChartData: PlotData[] = modelData.map((model, index) => {
    const total = model.risk_distribution.low + model.risk_distribution.medium + 
                 model.risk_distribution.high + model.risk_distribution.critical;
    
    if (total === 0) return null;
    
    const categories = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'];
    const values = [
      (model.risk_distribution.low / total) * 100,
      (model.risk_distribution.medium / total) * 100,
      (model.risk_distribution.high / total) * 100,
      (model.risk_distribution.critical / total) * 100
    ];
    const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
    
    return {
      type: 'scatterpolar',
      r: values,
      theta: categories,
      fill: 'toself',
      name: model.model_name,
      line: { color: colors[index % colors.length] },
      marker: { color: colors[index % colors.length], size: 8 },
      hovertemplate: '<b>%{fullData.name}</b><br>' +
                     '%{theta}: %{r:.1f}%<br>' +
                     '<extra></extra>'
    } as PlotData;
  }).filter(Boolean) as PlotData[];

  const radialChartLayout: Partial<Layout> = {
    title: {
      text: 'Model Risk Distribution (Radial View)',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 100],
        title: 'Percentage (%)'
      },
      angularaxis: {
        tickfont: { size: 12 }
      }
    },
    legend: {
      orientation: 'v',
      yanchor: 'middle',
      y: 0.5,
      xanchor: 'left',
      x: 1.05
    },
    margin: { t: 50, b: 50, l: 50, r: 150 }
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
    margin: { t: 50, b: 100, l: 60, r: 120 },
    xaxis: {
      title: {
        text: 'Models',
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      tickangle: -45,
      tickfont: { size: 12 }
    },
    yaxis: {
      title: {
        text: 'Number of Tests',
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      tickfont: { size: 12 }
    },
    barmode: 'stack',
    legend: {
      orientation: 'v',
      yanchor: 'middle',
      y: 0.5,
      xanchor: 'left',
      x: 1.02
    }
  };

  // Response Time Scatter Plot
  const scatterData: PlotData[] = [{
    x: vulnerabilityScores,
    y: safeguardRates,
    mode: 'markers',
    type: 'scatter',
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
    hovertemplate: '<b>%{customdata}</b><br>' +
                   'Vulnerability Score: %{x:.2f}<br>' +
                   'Safeguard Rate: %{y:.1f}%<br>' +
                   'Response Time: %{marker.color:.2f}s<br>' +
                   '<extra></extra>',
    customdata: modelData.map(m => m.model_name)
  }];

  const scatterLayout: Partial<Layout> = {
    title: {
      text: 'Model Performance Matrix',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 50, l: 60, r: 100 },
    xaxis: {
      title: {
        text: 'Vulnerability Score (0=Vulnerable, 10=Robust)',
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      range: [0, 10],
      tickfont: { size: 12 }
    },
    yaxis: {
      title: {
        text: 'Safeguard Success Rate (%)',
        font: { size: 14, family: 'Inter, sans-serif' }
      },
      range: [0, 100],
      tickfont: { size: 12 }
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
      <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="metric-select" className="text-sm font-medium text-gray-700">
              Compare by:
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableMetrics.map((metric) => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchModelData}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Dynamic Bar Chart with Dropdown */}
        <div id={`${chartId}-bar-chart`}>
          <Plot
            data={barChartData}
            layout={barChartLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Radial Chart for Risk Distribution */}
        <div id={`${chartId}-radial-chart`}>
          <Plot
            data={radialChartData}
            layout={radialChartLayout}
            config={config}
            style={{ width: '100%', height: '500px' }}
          />
        </div>

        {/* Risk Distribution Stacked Bar */}
        <div id={`${chartId}-risk-distribution`}>
          <Plot
            data={riskStackedData}
            layout={riskStackedLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Performance Matrix Scatter Plot */}
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
              <tr key={`model-${model.model_name}-${index}`} className="hover:bg-gray-50">
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