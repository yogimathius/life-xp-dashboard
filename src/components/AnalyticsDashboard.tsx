import React, { useState, useMemo } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { useEntries } from '../hooks/useEntries';
import { getDateRange, generateInsights } from '../utils/analytics';
import MetricChart from './charts/MetricChart';
import CorrelationMatrix from './charts/CorrelationMatrix';
import TrendAnalysis from './charts/TrendAnalysis';

interface AnalyticsDashboardProps {
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type ChartType = 'line' | 'bar' | 'area';

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { metrics } = useMetrics();
  const { entries } = useEntries();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('line');
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Calculate date range
  const dateRange = useMemo(() => 
    getDateRange(selectedTimeRange), 
    [selectedTimeRange]
  );

  // Generate insights
  const insights = useMemo(() => 
    generateInsights(entries, metrics, dateRange),
    [entries, metrics, dateRange]
  );

  // Filter metrics to display
  const displayMetrics = useMemo(() => {
    if (selectedMetrics.length === 0) return metrics;
    return metrics.filter(m => selectedMetrics.includes(m.id));
  }, [metrics, selectedMetrics]);

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  const chartTypeOptions = [
    { value: 'line', label: 'Line', icon: '📈' },
    { value: 'bar', label: 'Bar', icon: '📊' },
    { value: 'area', label: 'Area', icon: '🏔️' },
  ];

  if (metrics.length === 0) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <span className="text-4xl mb-4 block">📈</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Start tracking metrics to see your analytics dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          </div>
          <div className="text-sm text-gray-500">
            Showing data from {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Chart Type:</label>
            <div className="flex space-x-1">
              {chartTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedChartType(option.value as ChartType)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedChartType === option.value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={option.label}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Moving Average Toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={(e) => setShowMovingAverage(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">7-day average</span>
          </label>
        </div>

        {/* Metric Filter */}
        {metrics.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Show Metrics:</label>
              <button
                onClick={() => setSelectedMetrics([])}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                All
              </button>
              <span className="text-xs text-gray-400">|</span>
              <button
                onClick={() => setSelectedMetrics(metrics.map(m => m.id))}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                None
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.map(metric => (
                <button
                  key={metric.id}
                  onClick={() => handleMetricToggle(metric.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedMetrics.length === 0 || selectedMetrics.includes(metric.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedMetrics.length === 0 || selectedMetrics.includes(metric.id) 
                      ? metric.color 
                      : undefined
                  }}
                >
                  <span className="mr-1">{metric.icon}</span>
                  {metric.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">💡</span>
            <h3 className="text-lg font-semibold text-blue-900">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="text-blue-800 bg-white bg-opacity-60 rounded-lg p-3">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {displayMetrics.map(metric => (
          <MetricChart
            key={metric.id}
            metric={metric}
            entries={entries}
            dateRange={dateRange}
            chartType={selectedChartType}
            showMovingAverage={showMovingAverage}
          />
        ))}
      </div>

      {/* Analysis Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendAnalysis
          metrics={displayMetrics}
          entries={entries}
          dateRange={dateRange}
        />
        
        <CorrelationMatrix
          metrics={displayMetrics}
          entries={entries}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;