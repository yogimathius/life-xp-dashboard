import React from 'react';
import { MetricEntry, MetricDefinition } from '../../types';
import { prepareChartData, analyzeTrend, TrendAnalysis as TrendAnalysisType } from '../../utils/analytics';

interface TrendAnalysisProps {
  metrics: MetricDefinition[];
  entries: MetricEntry[];
  dateRange: { start: Date; end: Date };
  className?: string;
}

interface MetricTrend extends TrendAnalysisType {
  metric: MetricDefinition;
  dataPoints: number;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  metrics,
  entries,
  dateRange,
  className = '',
}) => {
  // Analyze trends for all metrics
  const metricTrends: MetricTrend[] = metrics
    .map(metric => {
      const data = prepareChartData(entries, metric.id, dateRange);
      const trend = analyzeTrend(data);
      return {
        ...trend,
        metric,
        dataPoints: data.length,
      };
    })
    .filter(trend => trend.dataPoints >= 3) // Only show trends with enough data
    .sort((a, b) => b.strength - a.strength); // Sort by trend strength

  const getTrendIcon = (direction: string, strength: number) => {
    if (strength < 0.3) return '➡️';
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (direction: string, strength: number) => {
    if (strength < 0.3) return 'text-gray-600 bg-gray-50';
    switch (direction) {
      case 'up': return 'text-green-700 bg-green-50';
      case 'down': return 'text-red-700 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStrengthBars = (strength: number) => {
    const bars = 5;
    const filled = Math.round(strength * bars);
    return (
      <div className="flex space-x-1">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={`w-1 h-4 rounded-full ${
              i < filled ? 'bg-current' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatChangePercent = (changePercent: number) => {
    const abs = Math.abs(changePercent);
    const sign = changePercent >= 0 ? '+' : '-';
    return `${sign}${abs.toFixed(1)}%`;
  };

  if (metricTrends.length === 0) {
    return (
      <div className={`trend-analysis ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📊</span>
            <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
          </div>
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📈</span>
              <p>No trend data available</p>
              <p className="text-sm">Track metrics for at least 3 days to see trends</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`trend-analysis ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
          </div>
          <div className="text-sm text-gray-500">
            {metricTrends.length} metrics analyzed
          </div>
        </div>

        <div className="space-y-4">
          {metricTrends.map((trend) => (
            <div
              key={trend.metric.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{trend.metric.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{trend.metric.name}</h4>
                    <p className="text-sm text-gray-500">
                      {trend.dataPoints} data points
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTrendIcon(trend.direction, trend.strength)}</span>
                  <div className="text-sm">
                    <div className={`px-2 py-1 rounded font-medium ${getTrendColor(trend.direction, trend.strength)}`}>
                      {trend.direction === 'up' ? 'Improving' : 
                       trend.direction === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatChangePercent(trend.changePercent)}
                  </div>
                  <div className="text-xs text-gray-500">change</div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={getTrendColor(trend.direction, trend.strength)}>
                    {getStrengthBars(trend.strength)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(trend.strength * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Key Insights
          </h4>
          <div className="space-y-2">
            {metricTrends
              .filter(t => t.strength > 0.5)
              .slice(0, 3)
              .map((trend) => (
                <div key={trend.metric.id} className="text-sm text-blue-800">
                  <span className="font-medium">{trend.metric.name}</span> shows a{' '}
                  <span className="font-medium">
                    {trend.strength > 0.7 ? 'strong' : 'moderate'}
                  </span>{' '}
                  {trend.direction === 'up' ? 'upward' : trend.direction === 'down' ? 'downward' : 'stable'} trend
                  {Math.abs(trend.changePercent) > 5 && (
                    <span> with {formatChangePercent(trend.changePercent)} change</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Understanding Trends</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Confidence bars:</span> Higher = more reliable
            </div>
            <div>
              <span className="font-medium">Change %:</span> Total change over period
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;