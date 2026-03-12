import React, { useState, useEffect } from 'react';
import { logger, usePerformanceLogger } from '../services/performanceLogger';

/**
 * Painel de Debug para visualização de logs e performance
 * Apenas disponível em desenvolvimento
 */
export function DebugPanel() {
  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const { getSessionStats, exportLogs, clearLogs } = usePerformanceLogger();
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getSessionStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getSessionStats]);

  const handleExportLogs = () => {
    exportLogs();
  };

  const handleClearLogs = () => {
    clearLogs();
    setStats(getSessionStats());
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[80vh] mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            🐛 PowerOS Debug Panel
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              📥 Export Logs
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1 bg-slate-500 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {['stats', 'logs', 'performance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Session Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Session ID:</span>
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-200">{stats.sessionId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Duration:</span>
                    <p className="text-slate-800 dark:text-slate-200">{stats.duration}s</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Total Logs:</span>
                    <p className="text-slate-800 dark:text-slate-200">{stats.totalLogs}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Errors:</span>
                    <p className="text-rose-600 dark:text-rose-400">{stats.errors}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600 dark:text-slate-400">Avg Memory:</span>
                    <p className="text-slate-800 dark:text-slate-200">{stats.avgMemory}MB</p>
                  </div>
                </div>
              </div>

              {/* Logs by Level */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Logs by Level</h3>
                <div className="space-y-2">
                  {Object.entries(stats.logsByLevel).map(([level, count]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{level}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logs by Category */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Logs by Category</h3>
                <div className="space-y-2">
                  {Object.entries(stats.logsByCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{category}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Logs recentes (últimos 100)
              </div>
              {/* Aqui você poderia implementar a visualização dos logs reais */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center text-slate-500 dark:text-slate-400">
                Log viewer implementation pending...
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Performance Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Memory Usage:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {stats.avgMemory}MB avg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Session Duration:</span>
                    <span className="text-slate-800 dark:text-slate-200">{stats.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Error Rate:</span>
                    <span className={stats.errors > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {stats.totalLogs > 0 ? Math.round((stats.errors / stats.totalLogs) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">💡 Performance Tips</h3>
                <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  <li>• Monitor memory usage to detect leaks</li>
                  <li>• Track API response times for optimization</li>
                  <li>• Measure component render performance</li>
                  <li>• Log user interactions for UX analysis</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
