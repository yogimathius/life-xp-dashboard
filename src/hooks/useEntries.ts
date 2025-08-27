import { useState, useEffect, useCallback } from 'react';
import { MetricEntry } from '../types';
import { entriesStorage } from '../utils/storage';

export const useEntries = () => {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entries from storage
  const loadEntries = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const storedEntries = entriesStorage.getEntries();
      setEntries(storedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
      console.error('Error loading entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new entry
  const addEntry = useCallback((entry: Omit<MetricEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEntry: MetricEntry = {
        ...entry,
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      entriesStorage.addEntry(newEntry);
      setEntries(prev => [...prev.filter(e => e.id !== newEntry.id), newEntry]);
      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      console.error('Error adding entry:', err);
      return null;
    }
  }, []);

  // Update an existing entry
  const updateEntry = useCallback((id: string, updates: Partial<Omit<MetricEntry, 'id' | 'createdAt'>>) => {
    try {
      setEntries(prev => {
        const updated = prev.map(entry => 
          entry.id === id 
            ? { ...entry, ...updates, updatedAt: new Date() } 
            : entry
        );
        entriesStorage.saveEntries(updated);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      console.error('Error updating entry:', err);
    }
  }, []);

  // Delete an entry
  const deleteEntry = useCallback((id: string) => {
    try {
      entriesStorage.deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      console.error('Error deleting entry:', err);
    }
  }, []);

  // Get entry by ID
  const getEntry = useCallback((id: string) => {
    return entries.find(entry => entry.id === id);
  }, [entries]);

  // Get entries for a specific metric
  const getEntriesByMetric = useCallback((metricId: string) => {
    return entries.filter(entry => entry.metricId === metricId);
  }, [entries]);

  // Get entries for a specific date
  const getEntriesByDate = useCallback((date: Date) => {
    const targetDate = new Date(date).toDateString();
    return entries.filter(entry => new Date(entry.date).toDateString() === targetDate);
  }, [entries]);

  // Get entries within a date range
  const getEntriesByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries]);

  // Get latest entry for each metric (for quick overview)
  const getLatestEntries = useCallback(() => {
    const latestByMetric = new Map<string, MetricEntry>();
    
    entries.forEach(entry => {
      const existing = latestByMetric.get(entry.metricId);
      if (!existing || entry.date > existing.date) {
        latestByMetric.set(entry.metricId, entry);
      }
    });
    
    return Array.from(latestByMetric.values());
  }, [entries]);

  // Get entries for today
  const getTodayEntries = useCallback(() => {
    const today = new Date();
    return getEntriesByDate(today);
  }, [getEntriesByDate]);

  // Check if entry exists for metric and date
  const hasEntryForDate = useCallback((metricId: string, date: Date) => {
    const targetDate = new Date(date).toDateString();
    return entries.some(entry => 
      entry.metricId === metricId && 
      new Date(entry.date).toDateString() === targetDate
    );
  }, [entries]);

  // Batch add entries (for bulk import)
  const addBatchEntries = useCallback((newEntries: Omit<MetricEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      const processedEntries = newEntries.map(entry => ({
        ...entry,
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const allEntries = [...entries, ...processedEntries];
      entriesStorage.saveEntries(allEntries);
      setEntries(allEntries);
      return processedEntries;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add batch entries');
      console.error('Error adding batch entries:', err);
      return [];
    }
  }, [entries]);

  // Clear all entries
  const clearAllEntries = useCallback(() => {
    try {
      entriesStorage.saveEntries([]);
      setEntries([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear entries');
      console.error('Error clearing entries:', err);
    }
  }, []);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getEntriesByMetric,
    getEntriesByDate,
    getEntriesByDateRange,
    getLatestEntries,
    getTodayEntries,
    hasEntryForDate,
    addBatchEntries,
    clearAllEntries,
    reloadEntries: loadEntries,
  };
};