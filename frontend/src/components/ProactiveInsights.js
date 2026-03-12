import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Painel de Insights Proativos do Assistente
 * Mostra sugestões inteligentes baseadas no contexto atual
 */
export function ProactiveInsights({ insights, onDismiss }) {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.2
      }
    },
    exit: { opacity: 0, y: -20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'alert': return '🚨';
      case 'care': return '🧠';
      default: return '💡';
    }
  };

  const getInsightColors = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300';
      case 'alert':
        return 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300';
      case 'care':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300';
    }
  };

  if (!insights || insights.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-4 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            🤖 Insights do Assistente
          </h3>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {insights.map((insight, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className={`p-4 rounded-2xl border-2 ${getInsightColors(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ 
                  repeat: insight.type === 'alert' ? Infinity : 0,
                  duration: 2,
                  repeatDelay: 3
                }}
                className="text-2xl flex-shrink-0"
              >
                {getInsightIcon(insight.type)}
              </motion.div>
              
              <div className="flex-1">
                <h4 className="font-bold mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm mb-2 opacity-90">
                  {insight.message}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-75">
                    Sugestão:
                  </span>
                  <span className="text-xs font-medium">
                    {insight.action}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDismiss(index)}
                className="text-lg opacity-50 hover:opacity-100 transition-opacity"
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
