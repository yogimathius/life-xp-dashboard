import React, { useState, useEffect } from 'react';
import { MetricDefinition, MetricEntry } from '../types';
import { useEntries } from '../hooks/useEntries';
import MetricInput from './MetricInput';

interface DataEntryFormProps {
  metrics: MetricDefinition[];
  selectedDate?: Date;
  onSave?: (entries: MetricEntry[]) => void;
  className?: string;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({
  metrics,
  selectedDate = new Date(),
  onSave,
  className = '',
}) => {
  const { addEntry, getEntriesByDate, hasEntryForDate } = useEntries();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing entries for the selected date
  useEffect(() => {
    const existingEntries = getEntriesByDate(selectedDate);
    const newFormData: Record<string, any> = {};
    const newNotes: Record<string, string> = {};

    metrics.forEach(metric => {
      const existingEntry = existingEntries.find(entry => entry.metricId === metric.id);
      if (existingEntry) {
        newFormData[metric.id] = existingEntry.value;
        newNotes[metric.id] = existingEntry.notes || '';
      } else {
        newFormData[metric.id] = metric.defaultValue;
        newNotes[metric.id] = '';
      }
    });

    setFormData(newFormData);
    setNotes(newNotes);
  }, [metrics, selectedDate, getEntriesByDate]);

  const handleValueChange = (metricId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [metricId]: value,
    }));
  };

  const handleNoteChange = (metricId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [metricId]: note,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const entries: MetricEntry[] = [];

      for (const metric of metrics) {
        if (formData[metric.id] !== undefined && formData[metric.id] !== null) {
          const entry = addEntry({
            metricId: metric.id,
            value: formData[metric.id],
            date: selectedDate,
            notes: notes[metric.id] || undefined,
          });

          if (entry) {
            entries.push(entry);
          }
        }
      }

      setMessage({ type: 'success', text: `Saved ${entries.length} entries successfully!` });
      onSave?.(entries);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save entries. Please try again.' });
      console.error('Error saving entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    const quickData: Record<string, any> = {};
    metrics.forEach(metric => {
      quickData[metric.id] = metric.defaultValue;
    });
    setFormData(quickData);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMetricsByCategory = (category: MetricDefinition['category']) => {
    return metrics.filter(metric => metric.category === category);
  };

  const categories: MetricDefinition['category'][] = ['sleep', 'mood', 'productivity', 'custom'];

  return (
    <form onSubmit={handleSubmit} className={`data-entry-form ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Daily Entry - {formatDate(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Quick Fill Defaults
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {categories.map(category => {
            const categoryMetrics = getMetricsByCategory(category);
            if (categoryMetrics.length === 0) return null;

            return (
              <div key={category} className="category-section">
                <h3 className="text-lg font-medium text-gray-800 mb-4 capitalize border-b border-gray-200 pb-2">
                  {category === 'custom' ? 'Other' : category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryMetrics.map(metric => (
                    <div key={metric.id} className="metric-entry bg-gray-50 p-4 rounded-lg">
                      <MetricInput
                        metric={metric}
                        value={formData[metric.id]}
                        onChange={(value) => handleValueChange(metric.id, value)}
                      />
                      
                      {/* Notes input */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={notes[metric.id] || ''}
                          onChange={(e) => handleNoteChange(metric.id, e.target.value)}
                          placeholder="Add any notes about this metric..."
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>

                      {/* Existing entry indicator */}
                      {hasEntryForDate(metric.id, selectedDate) && (
                        <div className="mt-2 text-xs text-blue-600 flex items-center">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                          Entry exists for this date
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Entries'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default DataEntryForm;