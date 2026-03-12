import { useState, useMemo } from 'react';

/**
 * Hook para filtragem baseada em bio-ritmo/energia
 * Permite selecionar nível de energia e destaca tarefas compatíveis
 */
export function useBioRhythmFilter(tasks) {
  const [energyLevel, setEnergyLevel] = useState('media'); // baixa | media | alta
  
  const energyLevels = {
    baixa: {
      label: '🔋 Baixa Energia',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800',
      description: 'Foco em tarefas simples e manutenção',
      maxComplexity: 2,
      recommendedTasks: ['Revisar emails', 'Organizar arquivos', 'Atualizar status', 'Pequenas correções']
    },
    media: {
      label: '⚡ Energia Média', 
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      description: 'Equilíbrio entre tarefas complexas e simples',
      maxComplexity: 4,
      recommendedTasks: ['Reuniões', 'Desenvolvimento', 'Estudo', 'Planejamento']
    },
    alta: {
      label: '🚀 Energia Alta',
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      description: 'Momento ideal para tarefas desafiadoras',
      maxComplexity: 5,
      recommendedTasks: ['Projetos complexos', 'Aprendizado profundo', 'Tomada de decisões', 'Criatividade']
    }
  };

  const taskComplexity = (task) => {
    // Verificar se task existe
    if (!task) return 1;
    
    // Algoritmo para calcular complexidade da tarefa
    let complexity = 1;
    
    // Baseado na prioridade
    if (task.priority === 'Alta') complexity += 2;
    else if (task.priority === 'Média') complexity += 1;
    
    // Baseado na categoria (tarefas de trabalho/estudo tendem a ser mais complexas)
    if (task.category === 'Trabalho' || task.category === 'Estudo') complexity += 1;
    
    // Baseado no prazo (tarefas com prazo urgente aumentam complexidade)
    if (task.due_date) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataTarefa = new Date(task.due_date);
      dataTarefa.setHours(0, 0, 0, 0);
      const diffDias = Math.round((dataTarefa.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDias <= 1) complexity += 1;
      else if (diffDias <= 3) complexity += 0.5;
    }
    
    // Baseado no tamanho do título (títulos maiores podem indicar tarefas mais complexas)
    if (task.title && task.title.length > 50) complexity += 0.5;
    
    return Math.min(5, Math.round(complexity));
  };

  const filteredTasks = useMemo(() => {
    const safeTasks = tasks || [];
    const currentEnergy = energyLevels[energyLevel];
    
    return safeTasks.map(task => {
      const complexity = taskComplexity(task);
      const isCompatible = complexity <= currentEnergy.maxComplexity;
      const isRecommended = currentEnergy.recommendedTasks.some(rec => 
        task.title && task.title.toLowerCase().includes(rec.toLowerCase())
      );
      
      return {
        ...task,
        complexidade: complexity,
        compativelEnergia: isCompatible,
        recomendadoParaEnergia: isRecommended,
        energiaRequerida: complexity <= 2 ? 'Baixa' : complexity <= 4 ? 'Média' : 'Alta'
      };
    });
  }, [tasks, energyLevel]);

  const energyStats = useMemo(() => {
    const safeTasks = tasks || [];
    const currentEnergy = energyLevels[energyLevel];
    
    const compatible = filteredTasks.filter(t => t.compativelEnergia && t.status === 'pendente').length;
    const recommended = filteredTasks.filter(t => t.recomendadoParaEnergia && t.status === 'pendente').length;
    const totalPending = safeTasks.filter(t => t && t.status === 'pendente').length;
    
    return {
      compativel: compatible,
      recomendado: recommended,
      totalPendentes: totalPending,
      percentualCompativel: totalPending > 0 ? Math.round((compatible / totalPending) * 100) : 0,
      sugestao: compatible === 0 
        ? 'Considere reduzir suas metas para este nível de energia'
        : compatible < totalPending * 0.5
        ? 'Foque nas tarefas destacadas para melhor aproveitamento'
        : 'Ótimo momento para ser produtivo!'
    };
  }, [filteredTasks, tasks, energyLevel]);

  return {
    energyLevel,
    setEnergyLevel,
    energyLevels,
    filteredTasks,
    energyStats,
    taskComplexity
  };
}
