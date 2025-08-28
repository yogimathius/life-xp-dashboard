// Enhanced export utilities for Life XP Dashboard
import { MetricEntry, MetricDefinition } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  includeCharts?: boolean;
  dateRange?: { start: Date; end: Date };
  selectedMetrics?: string[];
}

export interface PDFReportOptions {
  title?: string;
  includeInsights?: boolean;
  includeCharts?: boolean;
  includeRawData?: boolean;
}

// Enhanced CSV export with better formatting
export const exportToCSV = (
  entries: MetricEntry[],
  metrics: MetricDefinition[],
  options: ExportOptions = { format: 'csv' }
): string => {
  const metricMap = new Map(metrics.map(m => [m.id, m]));
  
  // Filter entries based on options
  let filteredEntries = entries;
  
  if (options.dateRange) {
    filteredEntries = entries.filter(entry => 
      entry.date >= options.dateRange!.start && 
      entry.date <= options.dateRange!.end
    );
  }
  
  if (options.selectedMetrics && options.selectedMetrics.length > 0) {
    filteredEntries = filteredEntries.filter(entry =>
      options.selectedMetrics!.includes(entry.metricId)
    );
  }
  
  // Enhanced headers with more details
  const headers = [
    'Date',
    'Metric Name',
    'Category',
    'Value',
    'Unit',
    'Raw Value',
    'Notes',
    'Created At',
    'Updated At'
  ];
  
  const rows = filteredEntries.map(entry => {
    const metric = metricMap.get(entry.metricId);
    const formattedValue = formatValueForDisplay(entry.value, metric?.type);
    
    return [
      format(entry.date, 'yyyy-MM-dd'),
      metric?.name || entry.metricId,
      metric?.category || 'unknown',
      formattedValue,
      metric?.unit || '',
      entry.value,
      entry.notes || '',
      format(entry.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      format(entry.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    ];
  });
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

// Enhanced Excel export with multiple sheets
export const exportToExcel = async (
  entries: MetricEntry[],
  metrics: MetricDefinition[],
  options: ExportOptions = { format: 'xlsx' }
): Promise<Uint8Array> => {
  const workbook = XLSX.utils.book_new();
  
  // Filter data based on options
  let filteredEntries = entries;
  let filteredMetrics = metrics;
  
  if (options.dateRange) {
    filteredEntries = entries.filter(entry => 
      entry.date >= options.dateRange!.start && 
      entry.date <= options.dateRange!.end
    );
  }
  
  if (options.selectedMetrics && options.selectedMetrics.length > 0) {
    filteredEntries = filteredEntries.filter(entry =>
      options.selectedMetrics!.includes(entry.metricId)
    );
    filteredMetrics = metrics.filter(metric =>
      options.selectedMetrics!.includes(metric.id)
    );
  }
  
  // Main data sheet
  const mainData = prepareExcelData(filteredEntries, filteredMetrics);
  const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Life Metrics Data');
  
  // Metrics configuration sheet
  const metricsData = [
    ['Metric ID', 'Name', 'Category', 'Type', 'Unit', 'Min', 'Max', 'Default', 'Description'],
    ...filteredMetrics.map(m => [
      m.id,
      m.name,
      m.category,
      m.type,
      m.unit || '',
      m.min || '',
      m.max || '',
      m.defaultValue || '',
      m.description || ''
    ])
  ];
  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics Config');
  
  // Summary sheet with statistics
  const summaryData = generateSummaryData(filteredEntries, filteredMetrics);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
};

// PDF report generation
export const exportToPDF = async (
  entries: MetricEntry[],
  metrics: MetricDefinition[],
  options: PDFReportOptions = {}
): Promise<jsPDF> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;
  
  // Title
  const title = options.title || 'Life XP Dashboard Report';
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Report metadata
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Total Entries: ${entries.length}`, 20, yPosition);
  yPosition += 10;
  pdf.text(`Tracked Metrics: ${metrics.length}`, 20, yPosition);
  yPosition += 20;
  
  // Insights section
  if (options.includeInsights) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Insights', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Add some sample insights (you can integrate with your analytics)
    const insights = generateInsightsForPDF(entries, metrics);
    insights.forEach(insight => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`• ${insight}`, 25, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
  }
  
  // Data table
  if (options.includeRawData) {
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Data', 20, yPosition);
    yPosition += 10;
    
    const tableData = entries
      .slice(-50) // Last 50 entries
      .map(entry => {
        const metric = metrics.find(m => m.id === entry.metricId);
        return [
          format(entry.date, 'MM/dd/yyyy'),
          metric?.name || entry.metricId,
          formatValueForDisplay(entry.value, metric?.type),
          entry.notes || ''
        ];
      });
    
    pdf.autoTable({
      startY: yPosition,
      head: [['Date', 'Metric', 'Value', 'Notes']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 },
    });
  }
  
  return pdf;
};

// Chart capture for PDF inclusion
export const captureChartAsImage = async (chartElement: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
  });
  
  return canvas.toDataURL('image/png');
};

// Import functionality
export const importFromCSV = (csvText: string): { entries: Partial<MetricEntry>[], errors: string[] } => {
  const lines = csvText.trim().split('\n');
  const errors: string[] = [];
  const entries: Partial<MetricEntry>[] = [];
  
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { entries: [], errors };
  }
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  // Expected headers
  const requiredHeaders = ['Date', 'Metric Name', 'Value'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    return { entries: [], errors };
  }
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });
      
      // Parse and validate the entry
      const entry: Partial<MetricEntry> = {
        date: new Date(rowData['Date']),
        metricId: rowData['Metric Name'], // This would need to be mapped to actual metric IDs
        value: parseValue(rowData['Value']),
        notes: rowData['Notes'] || undefined,
      };
      
      // Validate date
      if (isNaN(entry.date!.getTime())) {
        errors.push(`Row ${i + 1}: Invalid date format`);
        continue;
      }
      
      entries.push(entry);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { entries, errors };
};

// Helper functions
const formatValueForDisplay = (value: any, type?: string): string => {
  if (type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (type === 'time') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

const parseValue = (valueStr: string): any => {
  // Try to parse as number first
  const num = parseFloat(valueStr);
  if (!isNaN(num)) return num;
  
  // Check for boolean values
  const lower = valueStr.toLowerCase();
  if (lower === 'true' || lower === 'yes' || lower === '1') return true;
  if (lower === 'false' || lower === 'no' || lower === '0') return false;
  
  // Return as string
  return valueStr;
};

const prepareExcelData = (entries: MetricEntry[], metrics: MetricDefinition[]): any[][] => {
  const metricMap = new Map(metrics.map(m => [m.id, m]));
  
  const headers = [
    'Date', 'Metric Name', 'Category', 'Value', 'Unit', 'Raw Value', 
    'Notes', 'Created At', 'Updated At'
  ];
  
  const rows = entries.map(entry => {
    const metric = metricMap.get(entry.metricId);
    return [
      format(entry.date, 'yyyy-MM-dd'),
      metric?.name || entry.metricId,
      metric?.category || 'unknown',
      formatValueForDisplay(entry.value, metric?.type),
      metric?.unit || '',
      entry.value,
      entry.notes || '',
      format(entry.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      format(entry.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    ];
  });
  
  return [headers, ...rows];
};

const generateSummaryData = (entries: MetricEntry[], metrics: MetricDefinition[]): any[][] => {
  const summary = [
    ['Summary Statistics', ''],
    ['Total Entries', entries.length],
    ['Date Range', entries.length > 0 ? 
      `${format(Math.min(...entries.map(e => e.date.getTime())), 'yyyy-MM-dd')} to ${format(Math.max(...entries.map(e => e.date.getTime())), 'yyyy-MM-dd')}` 
      : 'No data'],
    ['Tracked Metrics', metrics.length],
    [''],
    ['Metric Breakdown', 'Entry Count']
  ];
  
  // Count entries per metric
  const metricCounts = new Map<string, number>();
  entries.forEach(entry => {
    metricCounts.set(entry.metricId, (metricCounts.get(entry.metricId) || 0) + 1);
  });
  
  metrics.forEach(metric => {
    summary.push([metric.name, metricCounts.get(metric.id) || 0]);
  });
  
  return summary;
};

const generateInsightsForPDF = (entries: MetricEntry[], metrics: MetricDefinition[]): string[] => {
  // Simple insights for PDF - you can enhance this with your analytics
  const insights: string[] = [];
  
  if (entries.length === 0) {
    insights.push('No data available for analysis');
    return insights;
  }
  
  // Basic statistics
  const dateRange = Math.ceil((Math.max(...entries.map(e => e.date.getTime())) - Math.min(...entries.map(e => e.date.getTime()))) / (1000 * 60 * 60 * 24));
  insights.push(`You have been tracking data for ${dateRange} days`);
  
  // Entry consistency
  const avgEntriesPerDay = entries.length / Math.max(dateRange, 1);
  if (avgEntriesPerDay > 3) {
    insights.push('Excellent tracking consistency! You\'re logging multiple metrics daily');
  } else if (avgEntriesPerDay > 1) {
    insights.push('Good tracking consistency, with regular daily entries');
  }
  
  // Most tracked metric
  const metricCounts = new Map<string, number>();
  entries.forEach(entry => {
    metricCounts.set(entry.metricId, (metricCounts.get(entry.metricId) || 0) + 1);
  });
  
  let mostTrackedMetric = '';
  let maxCount = 0;
  metricCounts.forEach((count, metricId) => {
    if (count > maxCount) {
      maxCount = count;
      mostTrackedMetric = metricId;
    }
  });
  
  if (mostTrackedMetric) {
    const metric = metrics.find(m => m.id === mostTrackedMetric);
    insights.push(`${metric?.name || mostTrackedMetric} is your most consistently tracked metric with ${maxCount} entries`);
  }
  
  return insights;
};