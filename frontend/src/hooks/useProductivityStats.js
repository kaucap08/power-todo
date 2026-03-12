import { useMemo, useCallback } from 'react';

/**
 * Hook para cálculo de estatísticas de produtividade
 * Implementa a Matriz de Eisenhower e cálculo de carga cognitiva
 * Otimizado com useMemo para performance
 */
export function useProductivityStats(tasks) {
  /**
   * Calcula peso cognitivo baseado na prioridade
   * @param {string} p - Prioridade da tarefa
   * @returns {number} Peso cognitivo (1-5)
   */
  const pesoCognitivo = useCallback((p) => {
    if (p === 'Alta') return 5;
    if (p === 'Média') return 3;
    return 1;
  }, []);

  /**
   * Implementação da Matriz de Eisenhower
   * Classifica tarefas em 4 quadrantes: Urgente/Importante
   * @param {Array} taskList - Lista de tarefas
   * @returns {Object} Matriz organizada
   */
  const matrizEisenhower = useCallback((taskList) => {
    const safeTasks = taskList || [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().slice(0, 10);

    return {
      // Q1: Urgente e Importante (Fazer agora)
      urgenteImportante: safeTasks.filter(t => {
        const isUrgent = t.due_date === hojeStr || t.priority === 'Alta';
        const isImportant = t.priority === 'Alta' || t.category === 'Trabalho';
        return t.status === 'pendente' && isUrgent && isImportant;
      }),
      
      // Q2: Não Urgente e Importante (Agendar)
      naoUrgenteImportante: safeTasks.filter(t => {
        const isUrgent = t.due_date === hojeStr || t.priority === 'Alta';
        const isImportant = t.priority === 'Alta' || t.category === 'Trabalho';
        return t.status === 'pendente' && !isUrgent && isImportant;
      }),
      
      // Q3: Urgente e Não Importante (Delegar)
      urgenteNaoImportante: safeTasks.filter(t => {
        const isUrgent = t.due_date === hojeStr || t.priority === 'Alta';
        const isImportant = t.priority === 'Alta' || t.category === 'Trabalho';
        return t.status === 'pendente' && isUrgent && !isImportant;
      }),
      
      // Q4: Não Urgente e Não Importante (Eliminar)
      naoUrgenteNaoImportante: safeTasks.filter(t => {
        const isUrgent = t.due_date === hojeStr || t.priority === 'Alta';
        const isImportant = t.priority === 'Alta' || t.category === 'Trabalho';
        return t.status === 'pendente' && !isUrgent && !isImportant;
      })
    };
  }, []);
  const {
    concluidas,
    progresso,
    distCategorias,
    maxCat,
    cargaHoje,
    cargaPercent,
    matriz,
  } = useMemo(() => {
    const safeTasks = tasks || [];

    const concluidasCount = safeTasks.filter(
      (t) => t.status === 'concluída'
    ).length;
    const progressoValor =
      safeTasks.length > 0
        ? Math.round((concluidasCount / safeTasks.length) * 100)
        : 0;

    const categoriasBase = ['Pessoal', 'Trabalho', 'Estudo', 'Saúde'];
    const dist = categoriasBase.map((cat) => ({
      nome: cat,
      total: safeTasks.filter((t) => t.category === cat).length,
    }));
    const maxCatValor = Math.max(1, ...dist.map((c) => c.total));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().slice(0, 10);

    const cargaHojeValor = safeTasks
      .filter((t) => t.due_date === hojeStr && t.status === 'pendente')
      .reduce((acc, t) => acc + pesoCognitivo(t.priority), 0);

    const cargaPercentValor = Math.min(200, cargaHojeValor * 10);

    // Calcular matriz de Eisenhower
    const matrizCalculada = matrizEisenhower(safeTasks);

    return {
      concluidas: concluidasCount,
      progresso: progressoValor,
      distCategorias: dist,
      maxCat: maxCatValor,
      cargaHoje: cargaHojeValor,
      cargaPercent: cargaPercentValor,
      matriz: matrizCalculada,
    };
  }, [tasks, pesoCognitivo, matrizEisenhower]);

  return {
    concluidas,
    progresso,
    distCategorias,
    maxCat,
    cargaHoje,
    cargaPercent,
    matriz,
  };
}

