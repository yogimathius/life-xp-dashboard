// Core types for the Life XP Dashboard

export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  type: 'rating' | 'slider' | 'time' | 'boolean' | 'number';
  category: 'sleep' | 'mood' | 'productivity' | 'custom';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  icon?: string;
  color?: string;
  createdAt: Date;
}

export interface MetricEntry {
  id: string;
  metricId: string;
  value: any;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardConfig {
  layout: 'grid' | 'list';
  visibleMetrics: string[];
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  chartType: 'line' | 'bar' | 'area';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  dataRetention: number; // days
  exportFormat: 'json' | 'csv';
}