import React from 'react';

/**
 * Container para Toast Notifications
 * Sistema de feedback visual para operações otimistas
 */
export function ToastContainer({ toasts, onRemove }) {
  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 border-emerald-600 text-white';
      case 'error':
        return 'bg-rose-500 border-rose-600 text-white';
      case 'warning':
        return 'bg-amber-500 border-amber-600 text-white';
      case 'critical':
        return 'bg-red-600 border-red-700 text-white animate-pulse';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-slate-700 border-slate-800 text-white';
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            relative p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm
            animate-slideInRight hover:shadow-xl transition-all duration-300
            ${getToastStyles(toast.type)}
          `}
          style={{
            animationDelay: `${index * 0.1}s`,
            maxWidth: '400px'
          }}
        >
          {/* Conteúdo do Toast */}
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">
              {getToastIcon(toast.type)}
            </span>
            
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm mb-1">
                {toast.title}
              </div>
              <div className="text-sm opacity-90 break-words">
                {toast.message}
              </div>
              
              {/* Action button se existir */}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 px-3 py-1 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Botão de fechar */}
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 ml-2 text-white/70 hover:text-white transition-colors hover:scale-110 active:scale-95"
            >
              ✕
            </button>
          </div>

          {/* Progress bar para auto-remove */}
          {toast.duration && toast.duration > 0 && (
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl overflow-hidden">
              <div 
                className="h-full bg-white/60 animate-progressBar"
                style={{ 
                  animationDuration: `${toast.duration}ms`,
                  animationFillMode: 'forwards'
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
