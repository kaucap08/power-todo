import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Hook para Command Palette (Ctrl+K)
 * Barra de comandos global para navegação rápida e criação de tarefas
 */

export const COMMAND_TYPES = {
  NAVIGATE: 'navigate',
  CREATE_TASK: 'create_task',
  FILTER: 'filter',
  ACTION: 'action',
  SEARCH: 'search'
};

/**
 * Hook principal do Command Palette
 */
export function useCommandPalette({ tasks, actions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commandHistory, setCommandHistory] = useState([]);
  const inputRef = useRef(null);

  /**
   * Comandos disponíveis
   */
  const commands = [
    // Navegação
    {
      id: 'nav-dashboard',
      type: COMMAND_TYPES.NAVIGATE,
      title: 'Dashboard',
      description: 'Ir para o dashboard principal',
      icon: '📊',
      keywords: ['dashboard', 'home', 'início', 'principal'],
      action: () => actions.setUIState({ menuAtivo: 'dashboard' })
    },
    {
      id: 'nav-calendar',
      type: COMMAND_TYPES.NAVIGATE,
      title: 'Prazos Ativos',
      description: 'Ver próximos prazos',
      icon: '📅',
      keywords: ['calendario', 'prazos', 'datas', 'deadlines'],
      action: () => actions.setUIState({ menuAtivo: 'calendario' })
    },
    {
      id: 'nav-settings',
      type: COMMAND_TYPES.NAVIGATE,
      title: 'Configurações',
      description: 'Abrir configurações',
      icon: '⚙️',
      keywords: ['config', 'settings', 'configurações', 'ajustes'],
      action: () => actions.setUIState({ menuAtivo: 'config' })
    },

    // Criação Rápida
    {
      id: 'create-task',
      type: COMMAND_TYPES.CREATE_TASK,
      title: 'Criar Tarefa Rápida',
      description: 'Criar nova tarefa',
      icon: '➕',
      keywords: ['criar', 'nova', 'adicionar', 'task', 'tarefa'],
      requiresInput: true,
      action: (input) => {
        if (input && input.trim()) {
          return actions.addTask({
            title: input.trim(),
            priority: 'Média',
            category: 'Pessoal'
          });
        }
      }
    },

    // Filtros
    {
      id: 'filter-all',
      type: COMMAND_TYPES.FILTER,
      title: 'Mostrar Todas',
      description: 'Ver todas as tarefas',
      icon: '📋',
      keywords: ['todas', 'all', 'mostrar', 'ver'],
      action: () => actions.setFilters({ filtroStatus: 'todas' })
    },
    {
      id: 'filter-pending',
      type: COMMAND_TYPES.FILTER,
      title: 'Apenas Pendentes',
      description: 'Filtrar tarefas pendentes',
      icon: '⏳',
      keywords: ['pendentes', 'pending', 'abertas', 'fazer'],
      action: () => actions.setFilters({ filtroStatus: 'pendentes' })
    },
    {
      id: 'filter-completed',
      type: COMMAND_TYPES.FILTER,
      title: 'Apenas Concluídas',
      description: 'Ver tarefas concluídas',
      icon: '✅',
      keywords: ['concluidas', 'completed', 'feitas', 'prontas'],
      action: () => actions.setFilters({ filtroStatus: 'concluidas' })
    },
    {
      id: 'filter-today',
      type: COMMAND_TYPES.FILTER,
      title: 'Tarefas de Hoje',
      description: 'Ver tarefas para hoje',
      icon: '📅',
      keywords: ['hoje', 'today', 'dia', 'atual'],
      action: () => actions.setFilters({ filtroPrazo: 'hoje' })
    },

    // Ações
    {
      id: 'clear-completed',
      type: COMMAND_TYPES.ACTION,
      title: 'Limpar Concluídas',
      description: 'Remover todas as tarefas concluídas',
      icon: '🧹',
      keywords: ['limpar', 'clear', 'remover', 'concluidas'],
      action: () => actions.clearCompleted(),
      destructive: true
    },
    {
      id: 'toggle-dark',
      type: COMMAND_TYPES.ACTION,
      title: 'Alternar Modo Escuro',
      description: 'Mudar tema claro/escuro',
      icon: '🌙',
      keywords: ['tema', 'dark', 'modo', 'escuro', 'claro'],
      action: () => actions.setUIState({ darkMode: !actions.state.ui.darkMode })
    },

    // Busca
    {
      id: 'search-tasks',
      type: COMMAND_TYPES.SEARCH,
      title: 'Buscar Tarefas',
      description: 'Procurar tarefas específicas',
      icon: '🔍',
      keywords: ['buscar', 'search', 'procurar', 'encontrar'],
      requiresInput: true,
      action: (input) => {
        if (input && input.trim()) {
          actions.setFilters({ busca: input.trim() });
        }
      }
    }
  ];

  /**
   * Filtra comandos baseado na query
   */
  const filteredCommands = useMemo(() => {
    if (!query) {
      return commands.slice(0, 8); // Mostrar apenas os primeiros quando não há query
    }

    const lowercaseQuery = query.toLowerCase();
    
    return commands.filter(command => {
      // Busca no título
      if (command.title.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Busca na descrição
      if (command.description.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Busca nos keywords
      if (command.keywords.some(keyword => keyword.includes(lowercaseQuery))) return true;
      
      return false;
    });
  }, [query, commands]);

  /**
   * Abre o command palette
   */
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    
    // Focar no input após um pequeno delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  /**
   * Fecha o command palette
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  /**
   * Executa comando selecionado
   */
  const executeCommand = useCallback((command) => {
    if (command.requiresInput && query.trim()) {
      // Comando que precisa de input
      const result = command.action(query);
      
      // Adicionar ao histórico
      setCommandHistory(prev => [
        { query, command: command.title, timestamp: Date.now() },
        ...prev.slice(0, 9) // Manter apenas 10 mais recentes
      ]);
      
      close();
      return result;
    } else if (!command.requiresInput) {
      // Comando direto
      const result = command.action();
      
      // Adicionar ao histórico
      setCommandHistory(prev => [
        { query, command: command.title, timestamp: Date.now() },
        ...prev.slice(0, 9)
      ]);
      
      close();
      return result;
    }
  }, [query, close]);

  /**
   * Navegação com teclado
   */
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        close();
        break;

      case 'Backspace':
        if (query === '' && commandHistory.length > 0) {
          e.preventDefault();
          // Restaurar última query do histórico
          const lastCommand = commandHistory[0];
          setQuery(lastCommand.query);
        }
        break;
    }
  }, [isOpen, selectedIndex, filteredCommands, executeCommand, close, query, commandHistory]);

  /**
   * Atalho global Ctrl+K
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K ou Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  /**
   * Atalhos de navegação quando aberto
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  /**
   * Auto-scroll para item selecionado
   */
  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      const element = document.getElementById(`command-${selectedIndex}`);
      element?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  /**
   * Stats para debug
   */
  const stats = useMemo(() => ({
    totalCommands: commands.length,
    filteredCount: filteredCommands.length,
    historyLength: commandHistory.length,
    isOpen
  }), [commands.length, filteredCommands.length, commandHistory.length, isOpen]);

  return {
    // Estado
    isOpen,
    query,
    selectedIndex,
    filteredCommands,
    commandHistory,
    stats,
    
    // Refs
    inputRef,
    
    // Ações
    open,
    close,
    setQuery,
    setSelectedIndex,
    executeCommand
  };
}
