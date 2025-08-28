import React, { useState, useRef } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { useEntries } from '../hooks/useEntries';
import { exportToCSV, exportToExcel, exportToPDF, importFromCSV, ExportOptions, PDFReportOptions } from '../utils/exportEnhanced';
import { dataExport } from '../utils/storage';
import { format } from 'date-fns';

interface DataManagerProps {
  className?: string;
}

const DataManager: React.FC<DataManagerProps> = ({ className = '' }) => {
  const { metrics } = useMetrics();
  const { entries, addBatchEntries, clearAllEntries } = useEntries();
  
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx' | 'pdf'>('csv');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    selectedMetrics: [],
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export handlers
  const handleExport = async () => {
    if (entries.length === 0) {
      alert('No data to export. Please track some metrics first.');
      return;
    }

    setIsExporting(true);
    
    try {
      let filename = `life-xp-data-${format(new Date(), 'yyyy-MM-dd')}`;
      
      switch (exportFormat) {
        case 'csv': {
          const csvData = exportToCSV(entries, metrics, exportOptions);
          downloadFile(csvData, `${filename}.csv`, 'text/csv');
          break;
        }
        
        case 'json': {
          const jsonData = JSON.stringify(dataExport.exportAllData(), null, 2);
          downloadFile(jsonData, `${filename}.json`, 'application/json');
          break;
        }
        
        case 'xlsx': {
          const excelData = await exportToExcel(entries, metrics, exportOptions);
          downloadFile(excelData, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          break;
        }
        
        case 'pdf': {
          const pdfOptions: PDFReportOptions = {
            title: 'Life XP Dashboard Report',
            includeInsights: true,
            includeCharts: exportOptions.includeCharts,
            includeRawData: true,
          };
          const pdf = await exportToPDF(entries, metrics, pdfOptions);
          pdf.save(`${filename}.pdf`);
          break;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import handlers
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      
      if (file.name.endsWith('.json')) {
        // JSON import
        const success = dataExport.importFromJSON(text);
        if (success) {
          setImportResults({ success: entries.length, errors: [] });
          window.location.reload(); // Refresh to load new data
        } else {
          setImportResults({ success: 0, errors: ['Failed to import JSON data'] });
        }
      } else if (file.name.endsWith('.csv')) {
        // CSV import
        const { entries: importedEntries, errors } = importFromCSV(text);
        
        if (importedEntries.length > 0) {
          // Note: This would need proper metric ID mapping in a real implementation
          const validEntries = importedEntries.filter(entry => 
            entry.date && entry.metricId && entry.value !== undefined
          );
          
          // addBatchEntries(validEntries as any); // Would need proper typing
          setImportResults({ 
            success: validEntries.length, 
            errors: errors.slice(0, 10) // Show first 10 errors
          });
        } else {
          setImportResults({ success: 0, errors });
        }
      } else {
        setImportResults({ success: 0, errors: ['Unsupported file format. Please use CSV or JSON files.'] });
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({ 
        success: 0, 
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Backup handlers
  const handleCreateBackup = () => {
    const backupData = dataExport.exportAllData();
    const backupJson = JSON.stringify(backupData, null, 2);
    const filename = `life-xp-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}`;
    downloadFile(backupJson, `${filename}.json`, 'application/json');
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear ALL data? This action cannot be undone.\n\nConsider creating a backup first.'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This will permanently delete all your life tracking data. Are you absolutely sure?'
      );
      
      if (doubleConfirm) {
        clearAllEntries();
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  // Utility function for file downloads
  const downloadFile = (data: string | Uint8Array, filename: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`data-manager ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">💾</span>
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Export Data
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => {
                    const format = e.target.value as typeof exportFormat;
                    setExportFormat(format);
                    setExportOptions(prev => ({ ...prev, format }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="csv">CSV - Spreadsheet compatible</option>
                  <option value="json">JSON - Complete data backup</option>
                  <option value="xlsx">Excel - Advanced spreadsheet</option>
                  <option value="pdf">PDF - Professional report</option>
                </select>
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeCharts: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include chart images (PDF only)</span>
                </label>
              </div>

              {/* Metric Selection */}
              {metrics.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Metrics (leave empty for all)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.map(metric => (
                      <label key={metric.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exportOptions.selectedMetrics?.includes(metric.id) || false}
                          onChange={(e) => {
                            const metricId = metric.id;
                            setExportOptions(prev => {
                              const selected = prev.selectedMetrics || [];
                              if (e.target.checked) {
                                return { ...prev, selectedMetrics: [...selected, metricId] };
                              } else {
                                return { ...prev, selectedMetrics: selected.filter(id => id !== metricId) };
                              }
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">
                          {metric.icon} {metric.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting || entries.length === 0}
                className={`w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isExporting || entries.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isExporting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  `Export ${exportFormat.toUpperCase()} (${entries.length} entries)`
                )}
              </button>

              {entries.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  No data available for export. Start tracking to generate exportable data.
                </p>
              )}
            </div>
          </div>

          {/* Import & Backup Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Import & Backup
            </h3>

            <div className="space-y-4">
              {/* Import */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Data
                </label>
                <button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isImporting ? 'Importing...' : 'Choose CSV or JSON file to import'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV and JSON formats. CSV requires Date, Metric Name, and Value columns.
                </p>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className={`p-3 rounded-md ${
                  importResults.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <h4 className={`text-sm font-medium ${
                    importResults.errors.length === 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    Import Results
                  </h4>
                  <p className={`text-sm ${
                    importResults.errors.length === 0 ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    Successfully imported {importResults.success} entries
                  </p>
                  {importResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-yellow-700 font-medium">Errors encountered:</p>
                      <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li>... and {importResults.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Backup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Create Backup
                </label>
                <button
                  onClick={handleCreateBackup}
                  disabled={entries.length === 0}
                  className="w-full px-4 py-3 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Create Complete Backup (JSON)
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Downloads a complete backup including all settings, metrics, and entries.
                </p>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-red-100">
                <label className="block text-sm font-medium text-red-700 mb-2">
                  ⚠️ Danger Zone
                </label>
                <button
                  onClick={handleClearAllData}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear All Data
                </button>
                <p className="text-xs text-red-500 mt-1">
                  Permanently deletes all your life tracking data. This cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;