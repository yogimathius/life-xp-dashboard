// Analytics utilities for Life XP Dashboard
import { MetricEntry, MetricDefinition } from '../types';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface ChartDataPoint {
  x: string | Date;
  y: number;
  label?: string;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-1
  description: string;
  changePercent: number;
}

export interface CorrelationResult {
  metricA: string;
  metricB: string;
  coefficient: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative' | 'none';
  pValue?: number;
}

// Time range utilities
export const getDateRange = (range: '7d' | '30d' | '90d' | '1y' | 'all' | 'custom', customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  
  if (range === 'all') {
    return { start: new Date(2020, 0, 1), end: now };
  }
  
  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  
  if (range === 'custom') {
    return { start: subDays(now, 30), end: now }; // Default fallback
  }
  
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }[range];
  
  return {
    start: subDays(now, days),
    end: now,
  };
};

// Prepare chart data for a specific metric
export const prepareChartData = (
  entries: MetricEntry[],
  metricId: string,
  dateRange: { start: Date; end: Date }
): ChartDataPoint[] => {
  const filteredEntries = entries
    .filter(entry => 
      entry.metricId === metricId &&
      entry.date >= dateRange.start &&
      entry.date <= dateRange.end
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return filteredEntries.map(entry => ({
    x: format(entry.date, 'yyyy-MM-dd'),
    y: typeof entry.value === 'number' ? entry.value : 
        typeof entry.value === 'boolean' ? (entry.value ? 1 : 0) : 0,
    label: format(entry.date, 'MMM dd, yyyy'),
  }));
};

// Fill missing dates with null values for consistent chart display
export const fillMissingDates = (
  data: ChartDataPoint[],
  dateRange: { start: Date; end: Date }
): ChartDataPoint[] => {
  const days = eachDayOfInterval(dateRange);
  const dataMap = new Map(data.map(point => [point.x.toString(), point]));
  
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return dataMap.get(dateStr) || {
      x: dateStr,
      y: 0,
      label: format(day, 'MMM dd, yyyy'),
    };
  });
};

// Calculate moving average
export const calculateMovingAverage = (data: ChartDataPoint[], windowSize: number = 7): ChartDataPoint[] => {
  return data.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);
    const average = window.reduce((sum, p) => sum + p.y, 0) / window.length;
    
    return {
      ...point,
      y: average,
    };
  });
};

// Trend analysis
export const analyzeTrend = (data: ChartDataPoint[]): TrendAnalysis => {
  if (data.length < 2) {
    return {
      direction: 'stable',
      strength: 0,
      description: 'Insufficient data for trend analysis',
      changePercent: 0,
    };
  }
  
  // Simple linear regression for trend
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p, i) => sum + i * p.y, 0);
  const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Calculate R-squared for strength
  const meanY = sumY / n;
  const ssTotal = data.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const ssRes = data.reduce((sum, p, i) => {
    const predicted = slope * i + (sumY - slope * sumX) / n;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);
  
  const rSquared = 1 - (ssRes / ssTotal);
  const strength = Math.max(0, Math.min(1, Math.abs(rSquared)));
  
  // Calculate percent change
  const firstValue = data[0].y;
  const lastValue = data[data.length - 1].y;
  const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.01) {
    direction = slope > 0 ? 'up' : 'down';
  }
  
  const description = `${direction === 'up' ? 'Upward' : direction === 'down' ? 'Downward' : 'Stable'} trend with ${
    strength > 0.7 ? 'strong' : strength > 0.4 ? 'moderate' : 'weak'
  } confidence`;
  
  return {
    direction,
    strength,
    description,
    changePercent,
  };
};

// Correlation analysis
export const calculateCorrelation = (
  entries: MetricEntry[],
  metricA: string,
  metricB: string,
  dateRange: { start: Date; end: Date }
): CorrelationResult => {
  const dataA = prepareChartData(entries, metricA, dateRange);
  const dataB = prepareChartData(entries, metricB, dateRange);
  
  // Create aligned datasets
  const alignedData: Array<{a: number, b: number}> = [];
  const dateMapB = new Map(dataB.map(p => [p.x.toString(), p.y]));
  
  for (const pointA of dataA) {
    const valueB = dateMapB.get(pointA.x.toString());
    if (valueB !== undefined) {
      alignedData.push({ a: pointA.y, b: valueB });
    }
  }
  
  if (alignedData.length < 3) {
    return {
      metricA,
      metricB,
      coefficient: 0,
      strength: 'weak',
      direction: 'none',
    };
  }
  
  // Pearson correlation coefficient
  const n = alignedData.length;
  const sumA = alignedData.reduce((sum, p) => sum + p.a, 0);
  const sumB = alignedData.reduce((sum, p) => sum + p.b, 0);
  const sumAB = alignedData.reduce((sum, p) => sum + p.a * p.b, 0);
  const sumA2 = alignedData.reduce((sum, p) => sum + p.a * p.a, 0);
  const sumB2 = alignedData.reduce((sum, p) => sum + p.b * p.b, 0);
  
  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  
  const coefficient = denominator === 0 ? 0 : numerator / denominator;
  
  const absCoeff = Math.abs(coefficient);
  let strength: 'weak' | 'moderate' | 'strong';
  if (absCoeff >= 0.7) strength = 'strong';
  else if (absCoeff >= 0.4) strength = 'moderate';
  else strength = 'weak';
  
  const direction = coefficient > 0.1 ? 'positive' : coefficient < -0.1 ? 'negative' : 'none';
  
  return {
    metricA,
    metricB,
    coefficient,
    strength,
    direction,
  };
};

// Generate insights from data
export const generateInsights = (
  entries: MetricEntry[],
  metrics: MetricDefinition[],
  dateRange: { start: Date; end: Date }
): string[] => {
  const insights: string[] = [];
  
  for (const metric of metrics) {
    const data = prepareChartData(entries, metric.id, dateRange);
    if (data.length < 3) continue;
    
    const trend = analyzeTrend(data);
    
    if (trend.strength > 0.5) {
      if (trend.direction === 'up' && trend.changePercent > 10) {
        insights.push(`📈 Your ${metric.name} has improved by ${trend.changePercent.toFixed(1)}% - great progress!`);
      } else if (trend.direction === 'down' && trend.changePercent < -10) {
        insights.push(`📉 Your ${metric.name} has declined by ${Math.abs(trend.changePercent).toFixed(1)}% - consider focusing on this area.`);
      }
    }
    
    // Check for consistency
    const values = data.map(p => p.y);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const coefficient_of_variation = Math.sqrt(variance) / mean;
    
    if (coefficient_of_variation < 0.15) {
      insights.push(`🎯 Your ${metric.name} tracking shows great consistency - you've established a solid routine!`);
    }
  }
  
  return insights;
};