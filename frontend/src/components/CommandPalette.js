import React from 'react';

/**
 * Componente Command Palette (Ctrl+K)
 * Interface de comandos global com navegação por teclado
 */
export function CommandPalette({ 
  isOpen, 
  query, 
  selectedIndex, 
  filteredCommands, 
  commandHistory,
  onClose,
  onQueryChange,
  onSelectIndex,
  onExecuteCommand,
  inputRef 
}) {
  if (!isOpen) return null;

  const getCommandIcon = (type) => {
    switch (type) {
      case 'navigate': return '📍';
      case 'create_task': return '➕';
      case 'filter': return '🔽';
      case 'action': return '⚡';
      case 'search': return '🔍';
      default: return '📌';
    }
  };

  const handleInputChange = (e) => {
    onQueryChange(e.target.value);
    onSelectIndex(0); // Resetar seleção quando digita
  };

  const handleCommandClick = (command, index) => {
    onSelectIndex(index);
    onExecuteCommand(command);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 animate-slideDown">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Input */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
            <span className="text-2xl">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Digite um comando ou busca..."
              className="flex-1 bg-transparent text-lg text-slate-800 dark:text-white placeholder-slate-500 outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd>
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd>
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd>
            </div>
          </div>

          {/* Comandos */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <div className="text-4xl mb-2">🔍</div>
                <div className="font-medium">Nenhum comando encontrado</div>
                <div className="text-sm mt-1">Tente buscar com outros termos</div>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <div
                    key={command.id}
                    id={`command-${index}`}
                    onClick={() => handleCommandClick(command, index)}
                    className={`
                      flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
                      ${index === selectedIndex 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">
                        {command.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-white">
                          {command.title}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {command.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                          {getCommandIcon(command.type)}
                        </span>
                        {command.destructive && (
                          <span className="text-xs px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico */}
          {query === '' && commandHistory.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                Comandos Recentes
              </div>
              <div className="space-y-1">
                {commandHistory.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                  >
                    <span>🕐</span>
                    <span>{item.query}</span>
                    <span className="text-xs opacity-75">→ {item.command}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                {filteredCommands.length} de {filteredCommands.length + commandHistory.length} resultados
              </div>
              <div className="flex items-center gap-4">
                <span>Pressione <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl+K</kbd> para abrir</span>
                <span>Pressione <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Esc</kbd> para fechar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
