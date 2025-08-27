import { useState, useEffect, useCallback } from 'react';
import { MetricDefinition } from '../types';
import { metricsStorage } from '../utils/storage';
import { defaultMetrics } from '../data/defaultMetrics';

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load metrics from storage
  const loadMetrics = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      
      let storedMetrics = metricsStorage.getMetrics();
      
      // If no metrics exist, initialize with defaults
      if (storedMetrics.length === 0) {
        storedMetrics = defaultMetrics;
        metricsStorage.saveMetrics(storedMetrics);
      }
      
      setMetrics(storedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new metric
  const addMetric = useCallback((metric: Omit<MetricDefinition, 'id' | 'createdAt'>) => {
    try {
      const newMetric: MetricDefinition = {
        ...metric,
        id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };

      metricsStorage.addMetric(newMetric);
      setMetrics(prev => [...prev.filter(m => m.id !== newMetric.id), newMetric]);
      return newMetric;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add metric');
      console.error('Error adding metric:', err);
      return null;
    }
  }, []);

  // Update an existing metric
  const updateMetric = useCallback((id: string, updates: Partial<MetricDefinition>) => {
    try {
      setMetrics(prev => {
        const updated = prev.map(metric => 
          metric.id === id ? { ...metric, ...updates } : metric
        );
        metricsStorage.saveMetrics(updated);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metric');
      console.error('Error updating metric:', err);
    }
  }, []);

  // Delete a metric
  const deleteMetric = useCallback((id: string) => {
    try {
      metricsStorage.deleteMetric(id);
      setMetrics(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete metric');
      console.error('Error deleting metric:', err);
    }
  }, []);

  // Get metric by ID
  const getMetric = useCallback((id: string) => {
    return metrics.find(metric => metric.id === id);
  }, [metrics]);

  // Get metrics by category
  const getMetricsByCategory = useCallback((category: MetricDefinition['category']) => {
    return metrics.filter(metric => metric.category === category);
  }, [metrics]);

  // Reset to default metrics
  const resetToDefaults = useCallback(() => {
    try {
      metricsStorage.saveMetrics(defaultMetrics);
      setMetrics(defaultMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset metrics');
      console.error('Error resetting metrics:', err);
    }
  }, []);

  // Load metrics on mount
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    addMetric,
    updateMetric,
    deleteMetric,
    getMetric,
    getMetricsByCategory,
    resetToDefaults,
    reloadMetrics: loadMetrics,
  };
};