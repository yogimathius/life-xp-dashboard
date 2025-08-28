import React, { useState, useMemo } from 'react';
import './App.css';
import DataEntryForm from './components/DataEntryForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GamificationDashboard from './components/GamificationDashboard';
import DataManager from './components/DataManager';
import { useMetrics } from './hooks/useMetrics';
import { useEntries } from './hooks/useEntries';
import { calculateGamificationStats } from './utils/gamification';

type ViewType = 'entry' | 'analytics' | 'gamification' | 'data';

function App() {
  const { metrics, loading: metricsLoading } = useMetrics();
  const { entries, getTodayEntries } = useEntries();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('entry');

  // Calculate gamification stats for header display
  const gamificationStats = useMemo(() => 
    calculateGamificationStats(entries, metrics),
    [entries, metrics]
  );
  
  const todayEntries = getTodayEntries();
  const totalMetrics = metrics.length;
  const todayProgress = todayEntries.length;

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Life XP Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Life XP Dashboard</h1>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Beta
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-1">
                <button
                  onClick={() => setCurrentView('entry')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'entry'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📝 Entry
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => setCurrentView('gamification')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'gamification'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🎮 Progress
                </button>
                <button
                  onClick={() => setCurrentView('data')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === 'data'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  💾 Data
                </button>
              </nav>
              
              <div className="hidden lg:flex items-center space-x-4">
                {/* Gamification Info */}
                {gamificationStats.level && (
                  <div className="flex items-center space-x-2">
                    <div className="text-xs">
                      <span className="text-purple-600 font-medium">
                        Level {gamificationStats.level.level}
                      </span>
                      <span className="text-gray-400 mx-1">•</span>
                      <span className="text-orange-600 font-medium">
                        🔥 {Math.max(...Array.from(gamificationStats.streaks.values()).map(s => s.current), 0)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    Today: {todayProgress}/{totalMetrics}
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalMetrics > 0 ? (todayProgress / totalMetrics) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'entry' ? (
          <>
            {/* Date Selector */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Track Your Metrics</h2>
                  <div className="flex items-center space-x-4">
                    <label htmlFor="date-select" className="text-sm font-medium text-gray-700">
                      Date:
                    </label>
                    <input
                      id="date-select"
                      type="date"
                      value={formatDateForInput(selectedDate)}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      max={formatDateForInput(new Date())}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-xl">📊</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Metrics</p>
                    <p className="text-xl font-semibold text-gray-900">{totalMetrics}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Today's Entries</p>
                    <p className="text-xl font-semibold text-gray-900">{todayProgress}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-xl">📈</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Entries</p>
                    <p className="text-xl font-semibold text-gray-900">{entries.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Entry Form */}
            {metrics.length > 0 ? (
              <DataEntryForm
                metrics={metrics}
                selectedDate={selectedDate}
                onSave={(entries) => {
                  console.log('Saved entries:', entries);
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-500">
                  <span className="text-4xl mb-4 block">📝</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics configured</h3>
                  <p className="text-gray-600">Get started by setting up your first life metrics to track.</p>
                </div>
              </div>
            )}
          </>
        ) : currentView === 'analytics' ? (
          /* Analytics View */
          <AnalyticsDashboard />
        ) : currentView === 'gamification' ? (
          /* Gamification View */
          <GamificationDashboard />
        ) : (
          /* Data Management View */
          <DataManager />
        )}
      </main>
    </div>
  );
}

export default App;
