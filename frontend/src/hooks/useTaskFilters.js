import { useState, useMemo, useCallback } from 'react';

/**
 * Hook para filtragem e ordenação de tarefas
 * Otimizado com useMemo para evitar re-renders desnecessários
 */
export function useTaskFilters(initialTasks) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas'); // todas | pendentes | concluidas
  const [filtroPrazo, setFiltroPrazo] = useState('todos'); // todos | hoje | atrasadas | em_breve
  const [ordenacao, setOrdenacao] = useState('recentes'); // recentes | antigas | prioridade

  /**
   * Calcula peso da prioridade para ordenação
   * @param {string} p - Prioridade (Alta, Média, Baixa)
   * @returns {number} Peso numérico
   */
  const prioridadePeso = useCallback((p) => {
    if (p === 'Alta') return 3;
    if (p === 'Média') return 2;
    return 1; // Baixa ou outros
  }, []);

    const tarefasFiltradas = useMemo(() => {
    const tasks = initialTasks || [];

    return tasks
      .filter((t) => {
        // Verificar se t e t.title existem antes de fazer toLowerCase()
        if (!t || !t.title) return false;
        return t.title.toLowerCase().includes(busca.toLowerCase());
      })
      .filter((t) => {
        if (!t || !t.due_date || filtroPrazo === 'todos') return true;

        try {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);

          const dataTarefa = new Date(t.due_date);
          dataTarefa.setHours(0, 0, 0, 0);

          const diffMs = dataTarefa.getTime() - hoje.getTime();
          const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (filtroPrazo === 'hoje') return diffDias === 0;
          if (filtroPrazo === 'atrasadas') return diffDias < 0;
          if (filtroPrazo === 'em_breve') return diffDias > 0 && diffDias <= 3;
          return true;
        } catch (error) {
          // Se houver erro ao processar a data, retorna true para não filtrar
          return true;
        }
      })
      .filter((t) => {
        if (!t || !t.status) return false;
        if (filtroStatus === 'pendentes') return t.status === 'pendente';
        if (filtroStatus === 'concluidas') return t.status === 'concluída';
        return true;
      })
      .sort((a, b) => {
        // Verificar se a e b existem
        if (!a || !b) return 0;
        
        if (ordenacao === 'antigas') {
          return (a.id || 0) - (b.id || 0);
        }
        if (ordenacao === 'prioridade') {
          return prioridadePeso(b.priority || 'Baixa') - prioridadePeso(a.priority || 'Baixa');
        }
        // recentes (padrão)
        return (b.id || 0) - (a.id || 0);
      });
  }, [initialTasks, busca, filtroStatus, filtroPrazo, ordenacao, prioridadePeso]);

  return {
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroPrazo,
    setFiltroPrazo,
    ordenacao,
    setOrdenacao,
    tarefasFiltradas,
  };
}

