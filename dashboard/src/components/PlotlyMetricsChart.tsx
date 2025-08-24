'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AssessmentMetrics } from '../types';
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

interface PlotlyMetricsChartProps {
  metrics: AssessmentMetrics | null;
  title?: string;
  chartId?: string;
}

const PlotlyMetricsChart: React.FC<PlotlyMetricsChartProps> = ({ 
  metrics, 
  title = 'Assessment Metrics',
  chartId = 'metrics-chart'
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !metrics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {!metrics ? 'No metrics data available' : 'Loading chart...'}
        </div>
      </div>
    );
  }

  // Debug: Log metrics to check advanced metrics availability
  console.log('PlotlyMetricsChart - Full metrics object:', metrics);
  console.log('Advanced metrics available?', metrics.advanced_metrics_available);
  console.log('BLEU score:', metrics.bleu_score_factual);
  console.log('Sentiment bias score:', metrics.sentiment_bias_score);
  console.log('Consistency score:', metrics.consistency_score);

  // Risk Distribution Radial Chart Data
  const riskDistribution = metrics.risk_distribution;
  const total = Object.values(riskDistribution).reduce((sum, count) => sum + count, 0);

  const radialData: PlotData[] = [{
    type: 'pie',
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
    values: [
      riskDistribution.low,
      riskDistribution.medium,
      riskDistribution.high,
      riskDistribution.critical
    ],
    hole: 0.4,
    marker: {
      colors: [
        RISK_COLORS.low.bg.replace('bg-', '#22c55e'), // Green
        RISK_COLORS.medium.bg.replace('bg-', '#eab308'), // Yellow
        RISK_COLORS.high.bg.replace('bg-', '#f97316'), // Orange
        RISK_COLORS.critical.bg.replace('bg-', '#ef4444') // Red
      ]
    },
    textinfo: 'label+percent',
    textposition: 'outside',
    hovertemplate: '<b>%{label}</b><br>' +
                   'Count: %{value}<br>' +
                   'Percentage: %{percent}<br>' +
                   '<extra></extra>'
  }];

  const radialLayout: Partial<Layout> = {
    title: {
      text: 'Risk Distribution',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 50, b: 50, l: 50, r: 50 },
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: -0.2,
      xanchor: 'center',
      x: 0.5
    },
    annotations: [{
      text: `Total<br>${total} Tests`,
      x: 0.5,
      y: 0.5,
      font: { size: 14, color: 'gray' },
      showarrow: false
    }]
  };

  // Category Performance Bar Chart
  const categories = Object.keys(metrics.category_breakdown || {});
  const categoryScores = categories.map(cat => 
    metrics.category_breakdown?.[cat]?.avg_vulnerability_score || 0
  );
  const categorySafeguardRates = categories.map(cat => 
    metrics.category_breakdown?.[cat]?.safeguard_success_rate || 0
  );

  const barData: PlotData[] = [
    {
      x: categories,
      y: categoryScores,
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
      x: categories,
      y: categorySafeguardRates,
      type: 'bar',
      name: 'Safeguard Success Rate',
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

  const barLayout: Partial<Layout> = {
    title: {
      text: 'Category Performance',
      font: { size: 16, family: 'Inter, sans-serif' }
    },
    font: { family: 'Inter, sans-serif' },
    margin: { t: 80, b: 80, l: 60, r: 60 },
    xaxis: {
      title: 'Categories',
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
      yanchor: 'top',
      y: 1.15,
      xanchor: 'center',
      x: 0.5
    },
    barmode: 'group'
  };

  const config: Partial<Config> = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Radial Chart */}
        <div id={`${chartId}-radial`}>
          <Plot
            data={radialData}
            layout={radialLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Category Performance Bar Chart */}
        <div id={`${chartId}-bar`}>
          <Plot
            data={barData}
            layout={barLayout}
            config={config}
            style={{ width: '100%', height: '400px' }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Overall Score</div>
          <div className="text-lg font-semibold text-gray-800">
            {metrics.overall_vulnerability_score?.toFixed(2) || 0}/10
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Safeguard Rate</div>
          <div className="text-lg font-semibold text-gray-800">
            {metrics.safeguard_success_rate?.toFixed(1) || 0}%
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Avg Response Time</div>
          <div className="text-lg font-semibold text-gray-800">
            {metrics.average_response_time?.toFixed(2) || 0}s
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">Total Tests</div>
          <div className="text-lg font-semibold text-gray-800">
            {total}
          </div>
        </div>
      </div>

      {/* Advanced Metrics Section */}
      {console.log('Rendering advanced metrics section? Condition:', metrics.advanced_metrics_available)}
      {metrics.advanced_metrics_available && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Advanced Metrics
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal">
              NLTK + Transformers Active
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {metrics.sentiment_bias_score !== undefined && metrics.sentiment_bias_score !== null && (
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

            {metrics.consistency_score !== undefined && metrics.consistency_score !== null && (
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
                {metrics.advanced_metrics_note}
              </p>
            </div>
          )}

          {metrics.advanced_metrics_error && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                Advanced metrics error: {metrics.advanced_metrics_error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlotlyMetricsChart;