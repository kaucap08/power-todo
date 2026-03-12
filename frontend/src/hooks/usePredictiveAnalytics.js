import { useMemo } from 'react';

/**
 * Hook para análise de eficiência preditiva
 * Compara tempo estimado vs tempo real das tarefas concluídas
 * Calcula precisão de planejamento e tendências de produtividade
 */
export function usePredictiveAnalytics(tasks) {
  const analytics = useMemo(() => {
    const safeTasks = tasks || [];
    
    // Filtrar apenas tarefas concluídas com dados de tempo
    const completedTasksWithTime = safeTasks.filter(
      task => task.status === 'concluída' && task.tempoEstimado && task.tempoReal
    );

    // Calcular precisão de planejamento
    const planningAccuracy = completedTasksWithTime.map(task => {
      const accuracy = (task.tempoEstimado / task.tempoReal) * 100;
      return {
        ...task,
        precisao: Math.min(100, Math.max(0, accuracy)), // Limitar entre 0-100%
        diferencaMinutos: task.tempoReal - task.tempoEstimado
      };
    });

    // Estatísticas gerais
    const avgAccuracy = completedTasksWithTime.length > 0
      ? planningAccuracy.reduce((sum, task) => sum + task.precisao, 0) / completedTasksWithTime.length
      : 0;

    const totalTasks = completedTasksWithTime.length;
    const overestimatedTasks = planningAccuracy.filter(task => task.precisao > 100).length;
    const underestimatedTasks = planningAccuracy.filter(task => task.precisao < 100).length;

    // Tendências por categoria
    const categoryAccuracy = {};
    completedTasksWithTime.forEach(task => {
      if (!categoryAccuracy[task.category]) {
        categoryAccuracy[task.category] = { total: 0, accuracy: 0, tasks: [] };
      }
      categoryAccuracy[task.category].total += 1;
      categoryAccuracy[task.category].accuracy += task.precisao || 0;
      categoryAccuracy[task.category].tasks.push(task);
    });

    // Calcular médias por categoria
    Object.keys(categoryAccuracy).forEach(category => {
      const data = categoryAccuracy[category];
      data.avgAccuracy = data.accuracy / data.total;
    });

    // Prever tempo para tarefas pendentes
    const pendingTasksPredictions = safeTasks
      .filter(task => task.status === 'pendente' && task.tempoEstimado)
      .map(task => {
        const categoryData = categoryAccuracy[task.category];
        const adjustmentFactor = categoryData ? categoryData.avgAccuracy / 100 : 1;
        const predictedTime = Math.round(task.tempoEstimado * adjustmentFactor);
        
        return {
          ...task,
          tempoPrevisto: predictedTime,
          confianca: categoryData ? Math.min(100, categoryData.total * 10) : 50
        };
      });

    return {
      planningAccuracy,
      avgAccuracy: Math.round(avgAccuracy),
      totalTasks,
      overestimatedTasks,
      underestimatedTasks,
      categoryAccuracy,
      pendingTasksPredictions,
      insights: {
        nivelPrecisao: avgAccuracy >= 90 ? 'Excelente' : avgAccuracy >= 70 ? 'Bom' : avgAccuracy >= 50 ? 'Regular' : 'Precisa Melhorar',
        tendenciaGeral: overestimatedTasks > underestimatedTasks ? 'Superestima prazos' : 'Subestima prazos',
        recomendacao: avgAccuracy < 70 
          ? 'Considere adicionar 20% mais tempo às suas estimativas'
          : avgAccuracy > 110 
          ? 'Você pode ser mais otimista em seus planejamentos'
          : 'Suas estimativas estão bem equilibradas'
      }
    };
  }, [tasks]);

  return analytics;
}
