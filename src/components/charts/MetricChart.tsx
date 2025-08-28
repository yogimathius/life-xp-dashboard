import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { MetricEntry, MetricDefinition } from '../../types';
import { prepareChartData, fillMissingDates, calculateMovingAverage } from '../../utils/analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricChartProps {
  metric: MetricDefinition;
  entries: MetricEntry[];
  dateRange: { start: Date; end: Date };
  chartType?: 'line' | 'bar' | 'area';
  showMovingAverage?: boolean;
  className?: string;
}

const MetricChart: React.FC<MetricChartProps> = ({
  metric,
  entries,
  dateRange,
  chartType = 'line',
  showMovingAverage = false,
  className = '',
}) => {
  // Prepare the data
  const rawData = prepareChartData(entries, metric.id, dateRange);
  const filledData = fillMissingDates(rawData, dateRange);
  const movingAverageData = showMovingAverage ? calculateMovingAverage(filledData, 7) : [];

  // Chart configuration
  const chartData = {
    labels: filledData.map(point => point.label),
    datasets: [
      {
        label: metric.name,
        data: filledData.map(point => point.y),
        borderColor: metric.color || '#3B82F6',
        backgroundColor: chartType === 'area' 
          ? `${metric.color || '#3B82F6'}20` 
          : `${metric.color || '#3B82F6'}80`,
        borderWidth: 2,
        fill: chartType === 'area',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: metric.color || '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      ...(showMovingAverage ? [{
        label: `${metric.name} (7-day avg)`,
        data: movingAverageData.map(point => point.y),
        borderColor: `${metric.color || '#3B82F6'}60`,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }] : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: metric.color || '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: (context: any) => context[0]?.label || '',
          label: (context: any) => {
            const value = context.parsed.y;
            const unit = metric.unit ? ` ${metric.unit}` : '';
            
            // Format based on metric type
            if (metric.type === 'boolean') {
              return `${context.dataset.label}: ${value ? 'Yes' : 'No'}`;
            } else if (metric.type === 'rating') {
              return `${context.dataset.label}: ${value}/5 stars`;
            } else {
              return `${context.dataset.label}: ${value}${unit}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: metric.unit || 'Value',
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        min: metric.type === 'boolean' ? 0 : metric.min,
        max: metric.type === 'boolean' ? 1 : metric.max,
        ticks: {
          callback: (value: any) => {
            if (metric.type === 'boolean') {
              return value === 1 ? 'Yes' : value === 0 ? 'No' : '';
            }
            return value;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  if (filledData.length === 0) {
    return (
      <div className={`metric-chart ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            {metric.icon && <span className="text-2xl mr-3">{metric.icon}</span>}
            <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
          </div>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📊</span>
              <p>No data available for this time period</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div className={`metric-chart ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {metric.icon && <span className="text-2xl mr-3">{metric.icon}</span>}
            <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
          </div>
          <div className="text-sm text-gray-500">
            {filledData.length} data points
          </div>
        </div>
        
        <div className="h-64 mb-4">
          <ChartComponent data={chartData} options={options} />
        </div>
        
        {metric.description && (
          <p className="text-sm text-gray-600 mt-2">{metric.description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricChart;