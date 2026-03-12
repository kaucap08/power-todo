import React from 'react';
import { TaskProvider } from './context/TaskContext';
import AppContent from './AppContent';
import './App.css';

/**
 * Componente raiz da aplicação PowerOS
 * Configura o TaskProvider para gerenciamento centralizado de estado
 */
function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;
