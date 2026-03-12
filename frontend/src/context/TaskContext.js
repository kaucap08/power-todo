import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  getTasks,
  createTask,
  toggleTaskStatus,
  deleteTaskById,
  clearCompletedTasks,
  updateTaskTitle,
} from '../services/taskService';

/**
 * Contexto centralizado para gerenciamento de tarefas e estado da aplicação
 * Implementa pattern Redux-like com useReducer para performance
 */

// Action types
const TASK_ACTIONS = {
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  TOGGLE_TASK: 'TOGGLE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  CLEAR_COMPLETED: 'CLEAR_COMPLETED',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  SET_UI_STATE: 'SET_UI_STATE',
  SET_GAMIFICATION: 'SET_GAMIFICATION',
  SET_FOCUS_MODE: 'SET_FOCUS_MODE',
  SET_ENERGY_LEVEL: 'SET_ENERGY_LEVEL',
};

// Initial state
const initialState = {
  // Dados principais
  tasks: [],
  loading: false,
  error: null,
  
  // Filtros e busca
  filters: {
    busca: '',
    filtroStatus: 'todas',
    filtroPrazo: 'todos',
    ordenacao: 'recentes',
  },
  
  // Estado da UI
  ui: {
    menuAtivo: 'dashboard',
    darkMode: false,
    editandoId: null,
    tituloEditando: '',
    energyLevel: 'media',
    deepWorkMode: false,
  },
  
  // Gamificação
  gamification: {
    xp: 0,
    nivel: 1,
    streak: 0,
  },
  
  // Focus mode
  focusMode: {
    focusTask: null,
    focusSeconds: 0,
    focusRunning: false,
  },
};

// Reducer
function taskReducer(state, action) {
  switch (action.type) {
    case TASK_ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload, loading: false };
      
    case TASK_ACTIONS.ADD_TASK:
      return { ...state, tasks: [...state.tasks, action.payload] };
      
    case TASK_ACTIONS.TOGGLE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, status: task.status === 'pendente' ? 'concluída' : 'pendente' }
            : task
        ),
      };
      
    case TASK_ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
      
    case TASK_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, title: action.payload.title }
            : task
        ),
      };
      
    case TASK_ACTIONS.CLEAR_COMPLETED:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.status !== 'concluída'),
      };
      
    case TASK_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case TASK_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
      
    case TASK_ACTIONS.SET_UI_STATE:
      return {
        ...state,
        ui: { ...state.ui, ...action.payload },
      };
      
    case TASK_ACTIONS.SET_GAMIFICATION:
      return {
        ...state,
        gamification: { ...state.gamification, ...action.payload },
      };
      
    case TASK_ACTIONS.SET_FOCUS_MODE:
      return {
        ...state,
        focusMode: { ...state.focusMode, ...action.payload },
      };
      
    case TASK_ACTIONS.SET_ENERGY_LEVEL:
      return {
        ...state,
        ui: { ...state.ui, energyLevel: action.payload },
      };
      
    default:
      return state;
  }
}

// Context
const TaskContext = createContext();

// Provider
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Carregar tarefas iniciais
  useEffect(() => {
    const loadTasks = async () => {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      try {
        const tasks = await getTasks();
        dispatch({ type: TASK_ACTIONS.SET_TASKS, payload: tasks });
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
      }
    };
    loadTasks();
  }, []);

  // Carregar preferências salvas
  useEffect(() => {
    try {
      const savedDarkMode = window.localStorage.getItem('poweros-dark-mode') === 'true';
      const savedXp = parseInt(window.localStorage.getItem('poweros-xp') || '0', 10);
      const savedStreak = parseInt(window.localStorage.getItem('poweros-streak') || '0', 10);
      
      dispatch({
        type: TASK_ACTIONS.SET_UI_STATE,
        payload: { darkMode: savedDarkMode },
      });
      
      dispatch({
        type: TASK_ACTIONS.SET_GAMIFICATION,
        payload: { xp: savedXp, streak: savedStreak, nivel: Math.floor(savedXp / 100) + 1 },
      });
    } catch (e) {
      // Ignorar erros de localStorage
    }
  }, []);

  // Aplicar classes do dark mode no HTML
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (state.ui.darkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [state.ui.darkMode]);

  // Actions
  const actions = {
    // Task actions
    addTask: async (taskData) => {
      try {
        const newTask = await createTask(taskData);
        dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: newTask });
        return newTask;
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    toggleTask: async (taskId) => {
      try {
        await toggleTaskStatus(taskId);
        dispatch({ type: TASK_ACTIONS.TOGGLE_TASK, payload: taskId });
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    deleteTask: async (taskId) => {
      try {
        await deleteTaskById(taskId);
        dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: taskId });
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    updateTask: async (taskId, title) => {
      try {
        await updateTaskTitle(taskId, title);
        dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: { id: taskId, title } });
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    clearCompleted: async () => {
      try {
        await clearCompletedTasks();
        dispatch({ type: TASK_ACTIONS.CLEAR_COMPLETED });
      } catch (error) {
        dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Filter actions
    setFilters: (filters) => {
      dispatch({ type: TASK_ACTIONS.SET_FILTERS, payload: filters });
    },

    // UI actions
    setUIState: (uiState) => {
      dispatch({ type: TASK_ACTIONS.SET_UI_STATE, payload: uiState });
      
      // Salvar preferências no localStorage
      if (uiState.darkMode !== undefined) {
        try {
          window.localStorage.setItem('poweros-dark-mode', String(uiState.darkMode));
        } catch (e) {
          // Ignorar erros
        }
      }
    },

    // Gamification actions
    updateGamification: (gamificationData) => {
      dispatch({ type: TASK_ACTIONS.SET_GAMIFICATION, payload: gamificationData });
      
      // Salvar no localStorage
      try {
        if (gamificationData.xp !== undefined) {
          window.localStorage.setItem('poweros-xp', String(gamificationData.xp));
        }
        if (gamificationData.streak !== undefined) {
          window.localStorage.setItem('poweros-streak', String(gamificationData.streak));
        }
      } catch (e) {
        // Ignorar erros
      }
    },

    // Focus mode actions
    setFocusMode: (focusData) => {
      dispatch({ type: TASK_ACTIONS.SET_FOCUS_MODE, payload: focusData });
    },

    // Energy level action
    setEnergyLevel: (level) => {
      dispatch({ type: TASK_ACTIONS.SET_ENERGY_LEVEL, payload: level });
    },

    // Utility actions
    clearError: () => {
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: null });
    },
  };

  const value = {
    state,
    actions,
    TASK_ACTIONS,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

// Hook para usar o contexto
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
