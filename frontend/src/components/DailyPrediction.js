import React from 'react';
import { motion } from 'framer-motion';

/**
 * Card de Previsão de Término do Dia
 * Motor de predição com sugestões proativas
 */
export function DailyPrediction({ predictionData, onMoveTask }) {
  if (!predictionData) return null;

  const { estimatedCompletionTime, recommendedTasksToMove, workloadLevel, dailyProgress } = predictionData;

  const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const isLateCompletion = estimatedCompletionTime.getHours() >= 18;
  const completionHour = estimatedCompletionTime.getHours();

  const workloadColors = {
    leve: 'from-emerald-400 to-emerald-600',
    moderado: 'from-amber-400 to-amber-600', 
    intenso: 'from-orange-400 to-orange-600',
    sobrecarregado: 'from-rose-400 to-rose-600'
  };

  const workloadLabels = {
    leve: 'Leve',
    moderado: 'Moderado',
    intenso: 'Intenso', 
    sobrecarregado: 'Sobrecarregado'
  };

  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${dailyProgress}%`,
      transition: {
        delay: 0.5,
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-2 ${
        isLateCompletion ? 'border-amber-400' : 'border-slate-200 dark:border-slate-800'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${
        isLateCompletion ? 'from-amber-400 to-orange-500' : 'from-indigo-400 to-purple-600'
      } p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">
              📅 Previsão do Dia
            </h3>
            <p className="text-white/90">
              Análise baseada no seu padrão de produtividade
            </p>
          </div>
          <motion.div
            animate={{ 
              rotate: isLateCompletion ? [0, 5, -5, 0] : 0,
              scale: isLateCompletion ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 2 },
              scale: { repeat: Infinity, duration: 1 }
            }}
            className="text-5xl"
          >
            {isLateCompletion ? '⚠️' : '✅'}
          </motion.div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Previsão de Horário */}
        <div className="text-center">
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
            Previsão de Término
          </div>
          <div className={`text-4xl font-black ${
            isLateCompletion ? 'text-amber-500' : 'text-emerald-500'
          }`}>
            {formatTime(estimatedCompletionTime)}
          </div>
          <div className={`text-sm mt-2 ${
            isLateCompletion ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {isLateCompletion 
              ? '⚠️ Previsão após as 18h - considere ajustar'
              : '✅ Dentro do horário comercial'
            }
          </div>
        </div>

        {/* Progresso Diário */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Progresso do Dia
            </span>
            <span className="text-sm font-bold text-indigo-500">
              {Math.round(dailyProgress)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              variants={progressVariants}
              initial="hidden"
              animate="visible"
            />
          </div>
        </div>

        {/* Nível de Carga */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          <div>
            <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
              Nível de Carga
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">
              {workloadLabels[workloadLevel]}
            </div>
          </div>
          <div className={`w-16 h-16 bg-gradient-to-r ${workloadColors[workloadLevel]} rounded-full flex items-center justify-center text-white font-black text-xl`}>
            {workloadLevel === 'leve' ? '😊' : 
             workloadLevel === 'moderado' ? '💪' : 
             workloadLevel === 'intenso' ? '🔥' : '⚡'}
          </div>
        </div>

        {/* Sugestões de Tarefas para Mover */}
        {recommendedTasksToMove.length > 0 && (
          <div>
            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4">
              📋 Sugestões para Amanhã
            </h4>
            <div className="space-y-3">
              {recommendedTasksToMove.map((item, index) => (
                <motion.div
                  key={item.task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
                >
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-800 dark:text-white mb-1">
                      {item.task.title}
                    </h5>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {item.reason}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onMoveTask(item.task)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors"
                  >
                    Mover →
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Insight Personalizado */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h5 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">
                Insight do Assistente
              </h5>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                {isLateCompletion 
                  ? 'Seu dia está mais intenso que o habitual. Considere focar nas 3 tarefas mais importantes e mover o restante para amanhã.'
                  : workloadLevel === 'sobrecarregado'
                  ? 'Você tem muitas tarefas hoje. Priorize as urgentes e importantes, deixando as secundárias para depois.'
                  : workloadLevel === 'leve'
                  ? 'Ótimo! Você tem espaço para tarefas complexas ou para adiantar trabalho futuro.'
                  : 'Equilíbrio perfeito! Mantenha o ritmo atual para máxima produtividade.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
