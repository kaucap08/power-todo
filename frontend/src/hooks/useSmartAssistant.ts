import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useProductivityStats } from './useProductivityStats';

/**
 * Hook principal do Assistente Inteligente PowerOS
 * Implementa motor de predição e interface adaptativa por humor
 */
export interface MoodState {
  mood: 'energizado' | 'motivado' | 'cansado' | 'estressado' | 'neutro';
  timestamp: Date;
  suggestions: string[];
}

export interface PredictionData {
  estimatedCompletionTime: Date;
  recommendedTasksToMove: Array<{
    task: any;
    reason: string;
    priority: number;
  }>;
  workloadLevel: 'leve' | 'moderado' | 'intenso' | 'sobrecarregado';
  dailyProgress: number;
}

export interface AdaptiveTheme {
  colorScheme: 'default' | 'warm' | 'cool' | 'energetic' | 'calm';
  backgroundIntensity: number;
  animationSpeed: number;
  cognitiveLoadFilter: boolean;
}

export function useSmartAssistant() {
  const { state, actions } = useTaskContext();
  const { matriz, cargaHoje, cargaPercent } = useProductivityStats(state.tasks);
  
  // Estado do assistente
  const [currentMood, setCurrentMood] = useState<MoodState>({
    mood: 'neutro',
    timestamp: new Date(),
    suggestions: []
  });
  
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [adaptiveTheme, setAdaptiveTheme] = useState<AdaptiveTheme>({
    colorScheme: 'default',
    backgroundIntensity: 1,
    animationSpeed: 1,
    cognitiveLoadFilter: false
  });

  /**
   * Motor de Predição - Analisa tempo médio e prevê término do dia
   */
  const calculateDailyPrediction = useCallback((): PredictionData => {
    const completedTasks = state.tasks.filter(t => t.status === 'concluída' && t.tempoReal);
    const pendingTasks = state.tasks.filter(t => t.status === 'pendente');
    
    // Calcular tempo médio por prioridade
    const avgTimeByPriority = {
      'Alta': completedTasks.filter(t => t.priority === 'Alta').length > 0
        ? completedTasks.filter(t => t.priority === 'Alta').reduce((sum, t) => sum + t.tempoReal, 0) / 
          completedTasks.filter(t => t.priority === 'Alta').length
        : 30, // padrão 30 min
      'Média': completedTasks.filter(t => t.priority === 'Média').length > 0
        ? completedTasks.filter(t => t.priority === 'Média').reduce((sum, t) => sum + t.tempoReal, 0) / 
          completedTasks.filter(t => t.priority === 'Média').length
        : 20, // padrão 20 min
      'Baixa': completedTasks.filter(t => t.priority === 'Baixa').length > 0
        ? completedTasks.filter(t => t.priority === 'Baixa').reduce((sum, t) => sum + t.tempoReal, 0) / 
          completedTasks.filter(t => t.priority === 'Baixa').length
        : 10, // padrão 10 min
    };

    // Calcular tempo total estimado para tarefas pendentes
    const totalEstimatedTime = pendingTasks.reduce((total, task) => {
      const avgTime = avgTimeByPriority[task.priority] || 20;
      return total + avgTime;
    }, 0);

    // Prever horário de conclusão (começando às 9h)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(9, 0, 0, 0);
    
    const estimatedCompletion = new Date(startOfDay.getTime() + (totalEstimatedTime * 60 * 1000));
    
    // Identificar tarefas para mover (baseado na Matriz de Eisenhower)
    const tasksToMove = pendingTasks
      .filter(task => {
        // Se passar das 18h, mover Q3 (Urgente/Importante) e Q4 (Não Urgente/Não Importante)
        if (estimatedCompletion.getHours() >= 18) {
          return matriz.urgenteNaoImportante.includes(task) || 
                 matriz.naoUrgenteNaoImportante.includes(task);
        }
        return false;
      })
      .map(task => ({
        task,
        reason: matriz.urgenteNaoImportante.includes(task) 
          ? 'Pode ser delegado ou feito amanhã'
          : 'Baixa prioridade - melhor para outro dia',
        priority: task.priority === 'Alta' ? 1 : task.priority === 'Média' ? 2 : 3
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3); // Máximo 3 sugestões

    // Determinar nível de carga
    const workloadLevel = cargaPercent <= 80 ? 'leve' :
                        cargaPercent <= 120 ? 'moderado' :
                        cargaPercent <= 160 ? 'intenso' : 'sobrecarregado';

    return {
      estimatedCompletionTime: estimatedCompletion,
      recommendedTasksToMove: tasksToMove,
      workloadLevel,
      dailyProgress: (completedTasks.length / Math.max(1, state.tasks.length)) * 100
    };
  }, [state.tasks, matriz, cargaPercent]);

  /**
   * Interface Adaptativa por Humor
   */
  const adaptInterfaceToMood = useCallback((mood: MoodState['mood']) => {
    const themeConfig: AdaptiveTheme = {
      energizado: {
        colorScheme: 'energetic',
        backgroundIntensity: 1.2,
        animationSpeed: 1.5,
        cognitiveLoadFilter: false
      },
      motivado: {
        colorScheme: 'default',
        backgroundIntensity: 1,
        animationSpeed: 1.2,
        cognitiveLoadFilter: false
      },
      cansado: {
        colorScheme: 'warm',
        backgroundIntensity: 0.7,
        animationSpeed: 0.8,
        cognitiveLoadFilter: true // Ocultar alta carga cognitiva
      },
      estressado: {
        colorScheme: 'calm',
        backgroundIntensity: 0.6,
        animationSpeed: 0.6,
        cognitiveLoadFilter: true
      },
      neutro: {
        colorScheme: 'default',
        backgroundIntensity: 1,
        animationSpeed: 1,
        cognitiveLoadFilter: false
      }
    }[mood];

    setAdaptiveTheme(themeConfig);
    
    // Gerar sugestões baseadas no humor
    const suggestions = {
      energizado: [
        'Ótimo momento para tarefas complexas!',
        'Considere iniciar projetos desafiadores.',
        'Sua energia está alta - aproveite!'
      ],
      motivado: [
        'Mantenha o foco nas tarefas importantes.',
        'Boa energia para progresso consistente.',
        'Continue com o plano atual.'
      ],
      cansado: [
        'Priorize tarefas simples e manutenção.',
        'Considere pausas frequentes.',
        'Foque em tarefas de baixa complexidade.',
        'Evite sobrecarga cognitiva hoje.'
      ],
      estressado: [
        'Respire fundo - uma tarefa de cada vez.',
        'Foque apenas no essencial hoje.',
        'Considere mover tarefas não urgentes.',
        'Priorize seu bem-estar.'
      ],
      neutro: [
        'Equilíbrio é a chave hoje.',
        'Mantenha o ritmo normal.',
        'Boa energia para tarefas variadas.'
      }
    }[mood];

    setCurrentMood({
      mood,
      timestamp: new Date(),
      suggestions
    });

    // Salvar preferência de humor
    try {
      localStorage.setItem('poweros-daily-mood', JSON.stringify({
        mood,
        date: new Date().toDateString()
      }));
    } catch (e) {
      // Ignorar erro
    }
  }, []);

  /**
   * Check-in diário de humor
   */
  const performMoodCheckIn = useCallback((mood: MoodState['mood']) => {
    adaptInterfaceToMood(mood);
    
    // Se estiver cansado/estressado, sugerir automaticamente ocultar tarefas de alta carga
    if (mood === 'cansado' || mood === 'estressado') {
      const highCognitiveTasks = state.tasks.filter(task => {
        if (task.status !== 'pendente') return false;
        
        // Calcular carga cognitiva
        let cognitiveLoad = 0;
        if (task.priority === 'Alta') cognitiveLoad += 3;
        if (task.category === 'Trabalho' || task.category === 'Estudo') cognitiveLoad += 2;
        if (task.due_date === new Date().toISOString().slice(0, 10)) cognitiveLoad += 1;
        
        return cognitiveLoad >= 5;
      });

      if (highCognitiveTasks.length > 0) {
        console.log(`🧠 Assistente: ${highCognitiveTasks.length} tarefas de alta carga cognitiva foram suavizadas para seu bem-estar.`);
      }
    }
  }, [adaptInterfaceToMood, state.tasks]);

  /**
   * Verificar check-in matinal automático
   */
  useEffect(() => {
    const checkDailyMood = () => {
      try {
        const savedMood = localStorage.getItem('poweros-daily-mood');
        const today = new Date().toDateString();
        
        if (savedMood) {
          const { date } = JSON.parse(savedMood);
          if (date !== today) {
            // Novo dia - solicitar check-in
            return true; // Mostrar modal de check-in
          }
        }
        return false; // Já fez check-in hoje
      } catch (e) {
        return true; // Erro - mostrar check-in
      }
    };

    // Verificar se precisa fazer check-in
    if (checkDailyMood()) {
      // Disparar evento para mostrar modal de check-in
      window.dispatchEvent(new CustomEvent('showMoodCheckIn'));
    }
  }, []);

  /**
   * Atualizar predições quando as tarefas mudam
   */
  useEffect(() => {
    const prediction = calculateDailyPrediction();
    setPredictionData(prediction);
  }, [calculateDailyPrediction]);

  /**
   * Aplicar tema adaptativo no CSS
   */
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar variáveis CSS baseadas no tema
    const themeVariables = {
      energetic: {
        '--primary-color': '#10b981',
        '--secondary-color': '#3b82f6',
        '--animation-speed': '0.8s',
        '--bg-intensity': '1.2'
      },
      warm: {
        '--primary-color': '#f59e0b',
        '--secondary-color': '#ef4444',
        '--animation-speed': '1.2s',
        '--bg-intensity': '0.7'
      },
      cool: {
        '--primary-color': '#06b6d4',
        '--secondary-color': '#8b5cf6',
        '--animation-speed': '1.5s',
        '--bg-intensity': '0.6'
      },
      calm: {
        '--primary-color': '#84cc16',
        '--secondary-color': '#14b8a6',
        '--animation-speed': '2s',
        '--bg-intensity': '0.6'
      },
      default: {
        '--primary-color': '#6366f1',
        '--secondary-color': '#8b5cf6',
        '--animation-speed': '1s',
        '--bg-intensity': '1'
      }
    }[adaptiveTheme.colorScheme];

    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [adaptiveTheme]);

  /**
   * Filtro de carga cognitiva baseado no humor
   */
  const filteredTasksByCognitiveLoad = useMemo(() => {
    if (!adaptiveTheme.cognitiveLoadFilter) {
      return state.tasks;
    }

    return state.tasks.map(task => {
      if (task.status !== 'pendente') return task;
      
      // Calcular carga cognitiva
      let cognitiveLoad = 0;
      if (task.priority === 'Alta') cognitiveLoad += 3;
      if (task.category === 'Trabalho' || task.category === 'Estudo') cognitiveLoad += 2;
      if (task.due_date === new Date().toISOString().slice(0, 10)) cognitiveLoad += 1;
      
      return {
        ...task,
        isHighCognitiveLoad: cognitiveLoad >= 5,
        cognitiveLoad
      };
    });
  }, [state.tasks, adaptiveTheme.cognitiveLoadFilter]);

  return {
    // Estado atual
    currentMood,
    predictionData,
    adaptiveTheme,
    filteredTasksByCognitiveLoad,
    
    // Ações
    performMoodCheckIn,
    adaptInterfaceToMood,
    
    // Utilitários
    needsMoodCheckIn: () => {
      try {
        const savedMood = localStorage.getItem('poweros-daily-mood');
        if (!savedMood) return true;
        
        const { date } = JSON.parse(savedMood);
        return date !== new Date().toDateString();
      } catch (e) {
        return true;
      }
    },
    
    // Insights proativos
    proactiveInsights: useMemo(() => {
      if (!predictionData) return [];
      
      const insights = [];
      
      // Insight sobre horário
      if (predictionData.estimatedCompletionTime.getHours() >= 18) {
        insights.push({
          type: 'warning',
          title: '⏰ Previsão de Término Tardia',
          message: `Previsão: ${predictionData.estimatedCompletionTime.getHours()}:${String(predictionData.estimatedCompletionTime.getMinutes()).padStart(2, '0')}`,
          action: 'Considere mover algumas tarefas para amanhã'
        });
      }
      
      // Insight sobre carga
      if (predictionData.workloadLevel === 'sobrecarregado') {
        insights.push({
          type: 'alert',
          title: '🔥 Alta Carga de Trabalho',
          message: 'Seu dia está muito intenso',
          action: 'Foque apenas no essencial hoje'
        });
      }
      
      // Insight sobre humor
      if (currentMood.mood === 'cansado' || currentMood.mood === 'estressado') {
        insights.push({
          type: 'care',
          title: '🧠 Cuidado com a Saúde Mental',
          message: 'Detectamos que você precisa de pausas',
          action: 'Tarefas complexas foram suavizadas'
        });
      }
      
      return insights;
    }, [predictionData, currentMood])
  };
}
