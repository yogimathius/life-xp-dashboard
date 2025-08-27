// Local storage utilities for Life XP Dashboard
import { MetricDefinition, MetricEntry, UserPreferences, DashboardConfig } from '../types';

const STORAGE_KEYS = {
  METRICS: 'lifeXP_metrics',
  ENTRIES: 'lifeXP_entries',
  PREFERENCES: 'lifeXP_preferences',
  DASHBOARD_CONFIG: 'lifeXP_dashboardConfig',
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item, (key, value) => {
        // Handle Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  clear: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing Life XP data:', error);
    }
  },
};

// Metric-specific storage functions
export const metricsStorage = {
  getMetrics: (): MetricDefinition[] => 
    storage.get(STORAGE_KEYS.METRICS, []),

  saveMetrics: (metrics: MetricDefinition[]): void => 
    storage.set(STORAGE_KEYS.METRICS, metrics),

  addMetric: (metric: MetricDefinition): void => {
    const metrics = metricsStorage.getMetrics();
    const updated = [...metrics.filter(m => m.id !== metric.id), metric];
    metricsStorage.saveMetrics(updated);
  },

  deleteMetric: (metricId: string): void => {
    const metrics = metricsStorage.getMetrics();
    const updated = metrics.filter(m => m.id !== metricId);
    metricsStorage.saveMetrics(updated);
  },
};

// Entry-specific storage functions
export const entriesStorage = {
  getEntries: (): MetricEntry[] => 
    storage.get(STORAGE_KEYS.ENTRIES, []),

  saveEntries: (entries: MetricEntry[]): void => 
    storage.set(STORAGE_KEYS.ENTRIES, entries),

  addEntry: (entry: MetricEntry): void => {
    const entries = entriesStorage.getEntries();
    const updated = [...entries.filter(e => e.id !== entry.id), entry];
    entriesStorage.saveEntries(updated);
  },

  deleteEntry: (entryId: string): void => {
    const entries = entriesStorage.getEntries();
    const updated = entries.filter(e => e.id !== entryId);
    entriesStorage.saveEntries(updated);
  },

  getEntriesByMetric: (metricId: string): MetricEntry[] => {
    const entries = entriesStorage.getEntries();
    return entries.filter(e => e.metricId === metricId);
  },

  getEntriesByDateRange: (startDate: Date, endDate: Date): MetricEntry[] => {
    const entries = entriesStorage.getEntries();
    return entries.filter(e => e.date >= startDate && e.date <= endDate);
  },
};

// Preferences and config storage
export const preferencesStorage = {
  getPreferences: (): UserPreferences => 
    storage.get(STORAGE_KEYS.PREFERENCES, {
      theme: 'system',
      notifications: false,
      dataRetention: 365,
      exportFormat: 'json',
    }),

  savePreferences: (preferences: UserPreferences): void => 
    storage.set(STORAGE_KEYS.PREFERENCES, preferences),

  getDashboardConfig: (): DashboardConfig => 
    storage.get(STORAGE_KEYS.DASHBOARD_CONFIG, {
      layout: 'grid',
      visibleMetrics: [],
      timeRange: '30d',
      chartType: 'line',
    }),

  saveDashboardConfig: (config: DashboardConfig): void => 
    storage.set(STORAGE_KEYS.DASHBOARD_CONFIG, config),
};

// Data export/import functions
export const dataExport = {
  exportAllData: () => {
    return {
      metrics: metricsStorage.getMetrics(),
      entries: entriesStorage.getEntries(),
      preferences: preferencesStorage.getPreferences(),
      dashboardConfig: preferencesStorage.getDashboardConfig(),
      exportedAt: new Date(),
      version: '1.0.0',
    };
  },

  exportToJSON: (): string => {
    const data = dataExport.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  exportToCSV: (): string => {
    const entries = entriesStorage.getEntries();
    const metrics = metricsStorage.getMetrics();
    const metricMap = new Map(metrics.map(m => [m.id, m.name]));

    const headers = ['Date', 'Metric', 'Value', 'Notes'];
    const rows = entries.map(entry => [
      entry.date.toISOString().split('T')[0],
      metricMap.get(entry.metricId) || entry.metricId,
      entry.value,
      entry.notes || '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  },

  importFromJSON: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString, (key, value) => {
        // Handle Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });

      if (data.metrics) metricsStorage.saveMetrics(data.metrics);
      if (data.entries) entriesStorage.saveEntries(data.entries);
      if (data.preferences) preferencesStorage.savePreferences(data.preferences);
      if (data.dashboardConfig) preferencesStorage.saveDashboardConfig(data.dashboardConfig);

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },
};