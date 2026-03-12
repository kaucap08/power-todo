import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from './context/TaskContext';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useProductivityStats } from './hooks/useProductivityStats';
import { usePredictiveAnalytics } from './hooks/usePredictiveAnalytics';
import { useBioRhythmFilter } from './hooks/useBioRhythmFilter';
import { useDeepWorkMode } from './hooks/useDeepWorkMode';
import { useAccessibility } from './hooks/useAccessibility';
import { useSmartAssistant } from './hooks/useSmartAssistant';
import { ProfessionalSidebar } from './components/ProfessionalSidebar';
import { MoodCheckInSimple } from './components/MoodCheckInSimple';
import { DailyPredictionSimple } from './components/DailyPredictionSimple';
import { ProactiveInsightsSimple } from './components/ProactiveInsightsSimple';

/**
 * Componente principal do conteúdo da aplicação
 * Utiliza o TaskContext para gerenciamento centralizado de estado
 */
function AppContent() {
  // Context e hooks principais
  const { state, actions } = useTaskContext();
  const { announce, enhanceAriaLabels } = useAccessibility();
  
  // Hook do Assistente Inteligente
  const {
    currentMood,
    predictionData,
    adaptiveTheme,
    filteredTasksByCognitiveLoad,
    performMoodCheckIn,
    proactiveInsights
  } = useSmartAssistant();
  
  // Estados locais para formulários
  const [novoTitulo, setNovoTitulo] = useState("");
  const [prioridade, setPrioridade] = useState("Média");
  const [categoria, setCategoria] = useState("Pessoal");
  const [due_date, setDueDate] = useState("");
  
  // Estado do modal de check-in
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  
  // Estado do sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hooks de filtragem e analytics
  const {
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    filtroPrazo,
    setFiltroPrazo,
    ordenacao,
    setOrdenacao,
    tarefasFiltradas,
  } = useTaskFilters(state.tasks);

  const {
    concluidas,
    progresso,
    distCategorias,
    maxCat,
    cargaHoje,
    cargaPercent,
    matriz,
  } = useProductivityStats(state.tasks);

  const analytics = usePredictiveAnalytics(state.tasks);
  
  const {
    energyLevel,
    setEnergyLevel,
    energyLevels,
    filteredTasks: energyFilteredTasks,
    energyStats,
  } = useBioRhythmFilter(tarefasFiltradas);

  const deepWork = useDeepWorkMode();

  // Áudio de conclusão
  const completeSound = useRef(null);
  useEffect(() => {
    completeSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
    completeSound.current.volume = 0.35;
  }, []);

  // Listener para check-in de humor
  useEffect(() => {
    const handleShowMoodCheckIn = () => {
      setShowMoodCheckIn(true);
    };

    window.addEventListener('showMoodCheckIn', handleShowMoodCheckIn);
    return () => window.removeEventListener('showMoodCheckIn', handleShowMoodCheckIn);
  }, []);

  // Aplicar tema adaptativo
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--animation-speed', `${adaptiveTheme.animationSpeed}s`);
    root.style.setProperty('--bg-intensity', adaptiveTheme.backgroundIntensity.toString());
  }, [adaptiveTheme]);

  // Funções de manipulação de tarefas
  const addTask = async () => {
    if (!novoTitulo.trim()) return;
    
    try {
      const taskData = {
        title: novoTitulo,
        priority: prioridade,
        category: categoria,
        due_date: due_date,
        tempoEstimado: 25, // Padrão 25 minutos
      };
      
      await actions.addTask(taskData);
      setNovoTitulo("");
      setDueDate("");
      announce(`Tarefa "${novoTitulo}" adicionada com sucesso`);
    } catch (error) {
      announce('Erro ao adicionar tarefa');
    }
  };

  const handleToggleClick = async (task) => {
    // Tocar som imediatamente no clique quando está marcando como concluída
    if (task.status === 'pendente' && completeSound.current) {
      try {
        const audio = completeSound.current;
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // falha no autoplay não deve quebrar a UI
          });
        }
      } catch (e) {
        // ignora erros de áudio
      }
      
      // Atualizar gamificação
      registrarConclusaoHoje();
    }

    try {
      await actions.toggleTask(task.id);
      announce(`Tarefa "${task.title}" ${task.status === 'pendente' ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      announce('Erro ao atualizar tarefa');
    }
  };

  const registrarConclusaoHoje = () => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().slice(0, 10);

      const raw = window.localStorage.getItem('poweros-completion-days') || '[]';
      let dias = [];
      try {
        dias = JSON.parse(raw);
      } catch {
        dias = [];
      }

      if (!Array.isArray(dias)) dias = [];
      if (!dias.includes(hojeStr)) {
        dias.push(hojeStr);
      }

      // calcula streak: quantos dias consecutivos até hoje
      const setDias = new Set(dias);
      let streakAtual = 0;
      const diaCursor = new Date(hoje);
      while (true) {
        const dStr = diaCursor.toISOString().slice(0, 10);
        if (setDias.has(dStr)) {
          streakAtual += 1;
          diaCursor.setDate(diaCursor.getDate() - 1);
        } else {
          break;
        }
      }

      const novoXp = state.gamification.xp + 10;
      const novoNivel = Math.floor(novoXp / 100) + 1;

      actions.updateGamification({
        xp: novoXp,
        nivel: novoNivel,
        streak: streakAtual,
      });

      window.localStorage.setItem('poweros-completion-days', JSON.stringify(Array.from(setDias)));
      window.localStorage.setItem('poweros-xp', String(novoXp));
      window.localStorage.setItem('poweros-streak', String(streakAtual));
    } catch (e) {
      // ignora qualquer erro de gamificação
    }
  };

  const deleteTask = async (id) => {
    try {
      await actions.deleteTask(id);
      announce('Tarefa excluída com sucesso');
    } catch (error) {
      announce('Erro ao excluir tarefa');
    }
  };

  const clearCompleted = async () => {
    try {
      await actions.clearCompleted();
      announce('Tarefas concluídas removidas');
    } catch (error) {
      announce('Erro ao limpar tarefas concluídas');
    }
  };

  const editarTaskTitulo = async () => {
    if (!state.ui.tituloEditando.trim() || !state.ui.editandoId) return;
    
    try {
      await actions.updateTask(state.ui.editandoId, state.ui.tituloEditando);
      actions.setUIState({ editandoId: null, tituloEditando: '' });
      announce('Tarefa atualizada com sucesso');
    } catch (error) {
      announce('Erro ao atualizar tarefa');
    }
  };

  const iniciarEdicao = (task) => {
    actions.setUIState({ 
      editandoId: task.id, 
      tituloEditando: task.title 
    });
  };

  const cancelarEdicao = () => {
    actions.setUIState({ 
      editandoId: null, 
      tituloEditando: '' 
    });
  };

  // Combinar filtros de energia com tarefas filtradas
  const tarefasComEnergia = energyFilteredTasks;
  
  // Aplicar filtro de carga cognitiva baseado no humor
  const tarefasFinais = adaptiveTheme.cognitiveLoadFilter 
    ? tarefasComEnergia.filter(task => !task.isHighCognitiveLoad)
    : tarefasComEnergia;

  // Função para mover tarefa para amanhã
  const moveTaskToTomorrow = async (task) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    
    try {
      await actions.updateTask(task.id, task.title);
      // Aqui você precisaria de uma função para atualizar a data
      // Por enquanto, vamos apenas anunciar
      announce(`Tarefa "${task.title}" movida para amanhã`);
    } catch (error) {
      announce('Erro ao mover tarefa');
    }
  };

  // Função para dismiss insights
  const dismissInsight = (index) => {
    setDismissedInsights(prev => [...prev, index]);
  };

  return (
    <div className={`app-root flex min-h-screen transition-colors duration-500 font-sans ${state.ui.darkMode ? 'modo-escuro' : 'modo-claro'}`}>

      {/* --- SIDEBAR PROFISSIONAL --- */}
      <ProfessionalSidebar
        state={state}
        actions={actions}
        tasks={tarefasFinais}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        gamification={state.gamification}
      />

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <main className={`flex-1 p-12 transition-all duration-300 ${deepWork.isActive ? 'hidden' : ''} ${
        isSidebarCollapsed ? 'ml-20' : 'ml-72'
      }`}>

        {/* PÁGINA DASHBOARD */}
        {state.ui.menuAtivo === 'dashboard' && (
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Insights Proativos do Assistente */}
            {proactiveInsights.length > 0 && !dismissedInsights.includes(0) && (
              <ProactiveInsightsSimple 
                insights={proactiveInsights} 
                onDismiss={dismissInsight}
              />
            )}

            {/* Card de Previsão Diária */}
            <DailyPredictionSimple 
              predictionData={predictionData}
              onMoveTask={moveTaskToTomorrow}
            />

            {/* Seletor de Energia (Bio-Ritmo) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">🔋 Nível de Energia Atual</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(energyLevels).map(([level, config]) => (
                  <button
                    key={level}
                    data-energy-level={level}
                    onClick={() => setEnergyLevel(level)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      energyLevel === level
                        ? `${config.bgColor} ${config.borderColor} ${config.color}`
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                    aria-label={`Definir energia como ${config.label}`}
                  >
                    <div className="text-sm font-bold">{config.label}</div>
                    <div className="text-xs mt-1 opacity-75">{config.description}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {energyStats.sugestao}
              </div>
            </div>

            {/* Eficiência Preditiva */}
            {analytics.totalTasks > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">📈 Análise de Eficiência</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-indigo-500">{analytics.avgAccuracy}%</div>
                    <div className="text-xs text-slate-500">Precisão de Planejamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-amber-500">{analytics.insights.nivelPrecisao}</div>
                    <div className="text-xs text-slate-500">Nível de Precisão</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-500">{analytics.totalTasks}</div>
                    <div className="text-xs text-slate-500">Tarefas Analisadas</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{analytics.insights.recomendacao}</p>
                </div>
              </div>
            )}

            {/* Cabeçalho de Estatísticas */}
            <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Dashboard Principal</h2>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Progresso Geral: {progresso}%</p>
                </div>
                <button onClick={clearCompleted} className="md:ml-10 bg-rose-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-600 transition-all active:scale-95" aria-label="Limpar tarefas concluídas">Limpar Concluídos</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Total de tarefas</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{state.tasks.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Pendentes</span>
                  <span className="text-2xl font-black text-amber-500">{state.tasks.length - concluidas}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Concluídas</span>
                  <span className="text-2xl font-black text-emerald-500">{concluidas}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Nível</span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase">Streak: {state.gamification.streak} dia(s)</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-black text-indigo-500">LVL {state.gamification.nivel}</span>
                    <span className="text-xs font-bold text-slate-400">{state.gamification.xp} XP</span>
                  </div>
                  <div className="w-full bg-slate-200/60 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (state.gamification.xp % 100))}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">
                    Próximo nível em {Math.max(0, 100 - (state.gamification.xp % 100))} XP
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Distribuição por categoria</span>
                  {distCategorias.map(cat => (
                    <div key={cat.nome} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-16 text-slate-500">{cat.nome}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200/70 dark:bg-slate-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                          style={{ width: `${(cat.total / maxCat) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{cat.total}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Carga cognitiva de hoje</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{cargaHoje}</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {cargaPercent}% da energia recomendada
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        cargaPercent <= 80
                          ? 'bg-emerald-400'
                          : cargaPercent <= 120
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, cargaPercent)}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">
                    {cargaPercent <= 80 && 'Dia leve, ótimo para avançar em projetos difíceis.'}
                    {cargaPercent > 80 && cargaPercent <= 120 && 'Dia intenso, mas ainda administrável.'}
                    {cargaPercent > 120 && 'Sua carga para hoje está alta. Considere mover algo para outro dia.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form de Criação Expandido */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-5">
              <div className="flex gap-4">
                <input
                  className="flex-1 bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all shadow-inner text-lg"
                  placeholder="O que precisa ser feito?"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  aria-label="Nova tarefa"
                />
                <button onClick={addTask} className="bg-indigo-600 text-white w-20 rounded-2xl font-black text-3xl shadow-lg hover:bg-indigo-700 active:scale-90" aria-label="Adicionar tarefa">+</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none" aria-label="Prioridade">
                  <option>Baixa</option><option>Média</option><option>Alta</option>
                </select>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none" aria-label="Categoria">
                  <option>Pessoal</option><option>Trabalho</option><option>Estudo</option><option>Saúde</option>
                </select>
                <input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 text-xs font-bold outline-none" aria-label="Data de vencimento" />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                <input
                  placeholder="🔍 Pesquisar na sua lista..."
                  className="flex-1 bg-transparent border-b-2 border-slate-100 dark:border-slate-800 py-2 text-sm dark:text-white outline-none focus:border-indigo-500"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  aria-label="Pesquisar tarefas"
                />
                <div className="flex flex-col gap-2 text-[10px] font-black uppercase">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFiltroPrazo('todos')}
                      className={`px-3 py-2 rounded-xl border-2 ${
                        filtroPrazo === 'todos'
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                      }`}
                      aria-label="Mostrar todas as tarefas"
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setFiltroPrazo('hoje')}
                      className={`px-3 py-2 rounded-xl border-2 ${
                        filtroPrazo === 'hoje'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                      }`}
                      aria-label="Filtrar tarefas de hoje"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setFiltroPrazo('atrasadas')}
                      className={`px-3 py-2 rounded-xl border-2 ${
                        filtroPrazo === 'atrasadas'
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                      }`}
                      aria-label="Filtrar tarefas atrasadas"
                    >
                      Atrasadas
                    </button>
                    <button
                      onClick={() => setFiltroPrazo('em_breve')}
                      className={`px-3 py-2 rounded-xl border-2 ${
                        filtroPrazo === 'em_breve'
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                      }`}
                      aria-label="Filtrar tarefas em breve"
                    >
                      Em breve
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2"
                      aria-label="Filtrar por status"
                    >
                      <option value="todas">Todas</option>
                      <option value="pendentes">Pendentes</option>
                      <option value="concluidas">Concluídas</option>
                    </select>
                    <select
                      value={ordenacao}
                      onChange={(e) => setOrdenacao(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2"
                      aria-label="Ordenar tarefas"
                    >
                      <option value="recentes">Mais recentes</option>
                      <option value="antigas">Mais antigas</option>
                      <option value="prioridade">Por prioridade</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Listagem de Tarefas com Estilo de Prioridade e Energia */}
            <ul className="space-y-4">
              {tarefasFinais.map(task => (
                <li 
                  key={task.id} 
                  className={`group flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-l-[10px] shadow-sm transition-all hover:translate-x-2 ${
                    task.priority === 'Alta' ? 'border-l-rose-500' : 
                    (task.priority === 'Média' ? 'border-l-amber-400' : 'border-l-sky-400')
                  } border dark:border-slate-800 ${
                    !task.compativelEnergia && task.status === 'pendente' ? 'opacity-60' : ''
                  } ${
                    task.recomendadoParaEnergia && task.status === 'pendente' ? 'ring-2 ring-emerald-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => handleToggleClick(task)}>
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                      task.status === 'concluída' 
                        ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' 
                        : 'bg-transparent border-slate-200 dark:border-slate-700'
                    }`}>
                      {task.status === 'concluída' && <span className="text-white font-bold">✓</span>}
                    </div>
                    <div className="flex flex-col">
                      {state.ui.editandoId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            className="bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
                            value={state.ui.tituloEditando}
                            onChange={(e) => actions.setUIState({ tituloEditando: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') editarTaskTitulo();
                              if (e.key === 'Escape') cancelarEdicao();
                            }}
                            aria-label="Editar título da tarefa"
                          />
                          <div className="flex gap-2 text-[10px] font-black uppercase">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editarTaskTitulo();
                              }}
                              className="px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                              aria-label="Salvar edição"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelarEdicao();
                              }}
                              className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                              aria-label="Cancelar edição"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className={`text-lg font-bold dark:text-slate-100 ${
                            task.status === 'concluída' ? 'line-through opacity-30 text-slate-500' : ''
                          }`}>{task.title}</span>
                          <div className="flex gap-2 mt-2 flex-wrap items-center">
                            <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-3 py-1 rounded-full uppercase"># {task.category}</span>
                            {task.due_date && <span className="text-[10px] font-black bg-rose-50 dark:bg-rose-900/30 text-rose-500 px-3 py-1 rounded-full uppercase tracking-tighter">⏰ {task.due_date}</span>}
                            {task.created_at && <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full uppercase tracking-tighter">🕒 {task.created_at}</span>}
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                              task.priority === 'Alta'
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500'
                                : task.priority === 'Média'
                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                                : 'bg-sky-50 dark:bg-sky-900/30 text-sky-500'
                            }`}>
                              {task.priority || 'Sem prioridade'}
                            </span>
                            {task.status === 'pendente' && (
                              <>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                  task.compativelEnergia 
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  🔋 {task.energiaRequerida}
                                </span>
                                {task.recomendadoParaEnergia && (
                                  <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                                    ⭐ Recomendado
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deepWork.startSession(task, 25);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Iniciar modo foco"
                    >
                      🎯
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        iniciarEdicao(task);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Editar tarefa"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Excluir tarefa"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PÁGINA ANALYTICS */}
        {state.ui.menuAtivo === 'analytics' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                📈 Analytics & Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Produtividade</h3>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400">87%</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Taxa de conclusão</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Tarefas Hoje</h3>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">12</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Pendentes</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">Streak</h3>
                  <p className="text-3xl font-black text-purple-600 dark:text-purple-400">7</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Dias consecutivos</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PÁGINA TAREFAS */}
        {state.ui.menuAtivo === 'tarefas' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                🎯 Todas as Tarefas
              </h2>
              <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                <span className="text-6xl mb-4 block">📋</span>
                <p className="text-lg">Gerenciamento completo de tarefas</p>
                <p className="text-sm mt-2">Filtros, ordenação e organização avançada</p>
              </div>
            </div>
          </div>
        )}

        {/* PÁGINA PROJETOS */}
        {state.ui.menuAtivo === 'projetos' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">
                📁 Projetos
              </h2>
              <div className="mb-4">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  Projeto selecionado: {state.ui.projetoSelecionado || 'Nenhum'}
                </span>
              </div>
              <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                <span className="text-6xl mb-4 block">📂</span>
                <p className="text-lg">Organização por projetos</p>
                <p className="text-sm mt-2">Pessoal, Trabalho e Estudos</p>
              </div>
            </div>
          </div>
        )}

        {/* OUTRAS PÁGINAS (CALENDARIO E CONFIG) */}
        {state.ui.menuAtivo === 'calendario' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6">Próximos Prazos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.tasks.filter(t => t.due_date).map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                  <p className="text-rose-500 font-bold text-xs uppercase mb-2">📅 {t.due_date}</p>
                  <h3 className="font-bold text-lg dark:text-white">{t.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.ui.menuAtivo === 'config' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-center border dark:border-slate-800">
            <h2 className="text-3xl font-black dark:text-white mb-4">Painel de Controle</h2>
            <p className="text-slate-400 mb-10">Aqui você poderá gerenciar integrações e backups no futuro.</p>
            <div className="space-y-4">
               <div className="flex justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl items-center">
                  <span className="font-bold dark:text-white">Idioma do Sistema</span>
                  <span className="text-indigo-500 font-black">Português (BR)</span>
               </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal Deep Work */}
      {deepWork.isActive && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/70 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-950/90 text-slate-50 rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative">
            <button
              onClick={deepWork.endSession}
              className="absolute top-5 right-6 text-slate-500 hover:text-slate-200 text-xl"
              aria-label="Fechar modo foco"
            >
              ✕
            </button>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-3">
              Modo Deep Work Ativo
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              {deepWork.currentTask?.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-6 text-[11px] font-black uppercase">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                Foco profundo
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {deepWork.currentTask?.category}
              </span>
              {deepWork.currentTask?.due_date && (
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/40">
                  ⏰ {deepWork.currentTask.due_date}
                </span>
              )}
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                  Sessão atual
                </p>
                <div className="text-5xl md:text-6xl font-black tabular-nums">
                  {deepWork.formattedTime}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000"
                      style={{ width: `${deepWork.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={deepWork.togglePause}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-[0.18em] hover:bg-emerald-400 active:scale-95 transition-all"
                    aria-label={deepWork.isPaused ? 'Retomar foco' : 'Pausar foco'}
                  >
                    {deepWork.isPaused ? 'Retomar' : 'Pausar'}
                  </button>
                  <button
                    onClick={() => deepWork.startSession(deepWork.currentTask, 25)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-200 font-bold text-[11px] uppercase tracking-[0.16em] hover:bg-slate-700 active:scale-95 transition-all"
                    aria-label="Redefinir para 25 minutos"
                  >
                    25 min
                  </button>
                  <button
                    onClick={() => deepWork.startSession(deepWork.currentTask, 50)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-200 font-bold text-[11px] uppercase tracking-[0.16em] hover:bg-slate-700 active:scale-95 transition-all"
                    aria-label="Redefinir para 50 minutos"
                  >
                    50 min
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Enquanto o Modo Deep Work está ativo, o restante do painel é
                  suavemente bloqueado para você focar apenas nesta tarefa.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
                Trilha sonora de concentração
              </div>
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk&controls=0&showinfo=0&autohide=1&iv_load_policy=3&cc_load_policy=0"
                  title="Trilha sonora de concentração"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mood Check-in */}
      <MoodCheckInSimple
        isOpen={showMoodCheckIn}
        onClose={() => setShowMoodCheckIn(false)}
        onMoodSelect={performMoodCheckIn}
      />

      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
    </div>
  );
}

export default AppContent;
