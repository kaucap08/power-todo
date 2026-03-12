import React, { useState, useEffect } from 'react';

/**
 * Sidebar Profissional PowerOS
 * Central de navegação categorizada com design corporativo
 */

// Ícones simulados (em produção use lucide-react)
const Icons = {
  Grid: () => <span className="text-xl">📊</span>,
  FolderOpen: () => <span className="text-xl">📁</span>,
  BarChart3: () => <span className="text-xl">📈</span>,
  Timer: () => <span className="text-xl">⏰</span>,
  Settings: () => <span className="text-xl">⚙️</span>,
  Trash2: () => <span className="text-xl">🗑️</span>,
  ChevronDown: () => <span className="text-sm">▼</span>,
  ChevronRight: () => <span className="text-sm">▶</span>,
  User: () => <span className="text-xl">👤</span>,
  Zap: () => <span className="text-xl">⚡</span>,
  Target: () => <span className="text-xl">🎯</span>,
  Menu: () => <span className="text-xl">☰</span>
};

export function ProfessionalSidebar({ 
  state, 
  actions, 
  tasks, 
  isCollapsed, 
  onToggleCollapse,
  gamification 
}) {
  const [expandedSections, setExpandedSections] = useState({
    projetos: true,
    analytics: false
  });

  // Calcular tarefas pendentes de hoje
  const todayTasksCount = tasks?.filter(task => {
    if (!task || task.status !== 'pendente') return false;
    if (!task.due_date) return false;
    
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_date).toDateString();
    return today === taskDate;
  }).length || 0;

  // Calcular XP total do usuário
  const totalXP = gamification?.xp || 0;
  const userLevel = gamification?.level || 1;
  const xpForNextLevel = userLevel * 1000;
  const xpProgress = (totalXP % 1000) / 10; // percentual para o próximo nível

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNavigation = (menu) => {
    actions.setUIState({ menuAtivo: menu });
  };

  const handleProjectSelect = (project) => {
    actions.setUIState({ 
      menuAtivo: 'projetos',
      projetoSelecionado: project 
    });
  };

  const handleFocusMode = () => {
    actions.setFocusMode(!state.ui.focusMode);
  };

  const handleClearCompleted = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as tarefas concluídas?')) {
      actions.clearCompleted();
    }
  };

  return (
    <aside className={`
      bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
      flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-20' : 'w-72'}
      ${isCollapsed ? 'fixed' : 'fixed'}
      h-full
    `}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
              P
            </div>
            <span className="font-black text-slate-800 dark:text-white text-xl">
              PowerOS
            </span>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Icons.Menu />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        
        {/* Dashboard */}
        <button
          onClick={() => handleNavigation('dashboard')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group
            ${state.ui.menuAtivo === 'dashboard' 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          <Icons.Grid />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        {/* Projetos - Expansível */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('projetos')}
            className={`
              w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-200 group
              ${state.ui.menuAtivo === 'projetos' 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icons.FolderOpen />
              {!isCollapsed && <span>Projetos</span>}
            </div>
            {!isCollapsed && (
              <div className="transition-transform duration-200">
                {expandedSections.projetos ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
              </div>
            )}
          </button>
          
          {expandedSections.projetos && !isCollapsed && (
            <div className="ml-8 space-y-1 animate-slideDown">
              {[
                { id: 'pessoal', name: 'Pessoal', icon: '👤', color: 'text-emerald-500' },
                { id: 'trabalho', name: 'Trabalho', icon: '💼', color: 'text-blue-500' },
                { id: 'estudos', name: 'Estudos', icon: '📚', color: 'text-purple-500' }
              ].map(project => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                    transition-all duration-200
                    ${state.ui.projetoSelecionado === project.id
                      ? `bg-slate-100 dark:bg-slate-800 ${project.color} font-medium`
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span>{project.icon}</span>
                  <span>{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Analytics */}
        <button
          onClick={() => handleNavigation('analytics')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group
            ${state.ui.menuAtivo === 'analytics' 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          <Icons.BarChart3 />
          {!isCollapsed && <span>Analytics</span>}
        </button>

        {/* Tarefas com Badge */}
        <button
          onClick={() => handleNavigation('tarefas')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group relative
            ${state.ui.menuAtivo === 'tarefas' 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          <Icons.Target />
          {!isCollapsed && <span>Tarefas</span>}
          
          {/* Badge de tarefas pendentes */}
          {todayTasksCount > 0 && (
            <div className={`
              absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold
              rounded-full w-5 h-5 flex items-center justify-center
              ${isCollapsed ? 'top-0 right-0' : ''}
            `}>
              {todayTasksCount}
            </div>
          )}
        </button>

        {/* Modo Foco */}
        <button
          onClick={handleFocusMode}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group
            ${state.ui.focusMode 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          <Icons.Timer />
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <div>Modo Foco</div>
              {state.ui.focusMode && (
                <div className="text-xs opacity-75">Ativo</div>
              )}
            </div>
          )}
        </button>
      </nav>

      {/* Utilidades - Rodapé */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2">
        
        {/* Configurações */}
        <button
          onClick={() => handleNavigation('config')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group
            ${state.ui.menuAtivo === 'config' 
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-500' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }
          `}
        >
          <Icons.Settings />
          {!isCollapsed && <span>Configurações</span>}
        </button>

        {/* Lixeira */}
        <button
          onClick={handleClearCompleted}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
            transition-all duration-200 group
            text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 
            hover:text-rose-600 dark:hover:text-rose-400
          `}
          title="Limpar tarefas concluídas"
        >
          <Icons.Trash2 />
          {!isCollapsed && <span>Lixeira</span>}
        </button>

        {/* Perfil do Usuário */}
        {!isCollapsed && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                <Icons.User />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 dark:text-white truncate">
                  Usuário PowerOS
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icons.Zap />
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Nível {userLevel}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    ({totalXP} XP)
                  </span>
                </div>
                
                {/* Barra de Progresso XP */}
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versão recolhida do perfil */}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              <Icons.User />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
