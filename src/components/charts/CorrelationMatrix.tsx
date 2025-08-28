import React from 'react';
import { MetricEntry, MetricDefinition } from '../../types';
import { calculateCorrelation, CorrelationResult } from '../../utils/analytics';

interface CorrelationMatrixProps {
  metrics: MetricDefinition[];
  entries: MetricEntry[];
  dateRange: { start: Date; end: Date };
  className?: string;
}

const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  metrics,
  entries,
  dateRange,
  className = '',
}) => {
  // Calculate correlations between all metric pairs
  const correlations: CorrelationResult[] = [];
  
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const correlation = calculateCorrelation(
        entries,
        metrics[i].id,
        metrics[j].id,
        dateRange
      );
      correlations.push(correlation);
    }
  }

  // Sort by absolute correlation strength
  const sortedCorrelations = correlations
    .filter(c => Math.abs(c.coefficient) > 0.1) // Only show meaningful correlations
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  const getStrengthColor = (coefficient: number) => {
    const abs = Math.abs(coefficient);
    if (abs >= 0.7) return coefficient > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
    if (abs >= 0.4) return coefficient > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    return coefficient > 0 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50';
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'moderate': return 'Moderate';
      default: return 'Weak';
    }
  };

  const getDirectionIcon = (direction: string, coefficient: number) => {
    if (direction === 'positive') return '📈';
    if (direction === 'negative') return '📉';
    return '➡️';
  };

  const getMetricName = (metricId: string) => {
    return metrics.find(m => m.id === metricId)?.name || metricId;
  };

  const getMetricIcon = (metricId: string) => {
    return metrics.find(m => m.id === metricId)?.icon || '📊';
  };

  if (sortedCorrelations.length === 0) {
    return (
      <div className={`correlation-matrix ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🔗</span>
            <h3 className="text-lg font-semibold text-gray-900">Metric Correlations</h3>
          </div>
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <span className="text-3xl mb-2 block">🔍</span>
              <p>No significant correlations found</p>
              <p className="text-sm">Try tracking for a longer period</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`correlation-matrix ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔗</span>
            <h3 className="text-lg font-semibold text-gray-900">Metric Correlations</h3>
          </div>
          <div className="text-sm text-gray-500">
            {sortedCorrelations.length} significant relationships found
          </div>
        </div>

        <div className="space-y-4">
          {sortedCorrelations.map((correlation, index) => (
            <div 
              key={`${correlation.metricA}-${correlation.metricB}`}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <span>{getMetricIcon(correlation.metricA)}</span>
                  <span className="font-medium text-gray-900">
                    {getMetricName(correlation.metricA)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {getDirectionIcon(correlation.direction, correlation.coefficient)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span>{getMetricIcon(correlation.metricB)}</span>
                  <span className="font-medium text-gray-900">
                    {getMetricName(correlation.metricB)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getStrengthColor(correlation.coefficient)}`}>
                    {getStrengthText(correlation.strength)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    r = {correlation.coefficient.toFixed(3)}
                  </div>
                </div>
                
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      correlation.coefficient > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.abs(correlation.coefficient) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Understanding Correlations</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Strong (0.7+):</span> Very likely related
            </div>
            <div>
              <span className="font-medium">Moderate (0.4-0.7):</span> Possibly related
            </div>
            <div>
              <span className="font-medium">📈 Positive:</span> Increase together
            </div>
            <div>
              <span className="font-medium">📉 Negative:</span> One increases, other decreases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationMatrix;