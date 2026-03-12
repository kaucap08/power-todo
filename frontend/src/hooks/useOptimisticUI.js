import { useState, useCallback, useRef } from 'react';

/**
 * Hook para Optimistic UI com rollback resiliente
 * Implementa feedback instantâneo e tratamento de erro robusto
 */

// Tipos para as operações
export const OPERATION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE', 
  DELETE: 'DELETE',
  TOGGLE: 'TOGGLE',
  CLEAR_COMPLETED: 'CLEAR_COMPLETED'
};

export const OPERATION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
  ROLLED_BACK: 'rolled_back'
};

/**
 * hook para gerenciar operações otimistas
 */
export function useOptimisticUI() {
  const [operations, setOperations] = useState(new Map());
  const [toastNotifications, setToastNotifications] = useState([]);
  const operationIdCounter = useRef(0);

  /**
   * Gera ID único para operação
   */
  const generateOperationId = useCallback(() => {
    return `op_${Date.now()}_${++operationIdCounter.current}`;
  }, []);

  /**
   * Adiciona notificação toast
   */
  const addToast = useCallback((notification) => {
    const id = `toast_${Date.now()}`;
    const newToast = { ...notification, id, timestamp: Date.now() };
    
    setToastNotifications(prev => [...prev, newToast]);

    // Auto-remove após tempo configurado
    setTimeout(() => {
      removeToast(id);
    }, notification.duration || 5000);

    return id;
  }, []);

  /**
   * Remove notificação toast
   */
  const removeToast = useCallback((id) => {
    setToastNotifications(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Executa operação otimista com rollback
   */
  const executeOptimisticOperation = useCallback(async ({
    type,
    optimisticAction,
    apiCall,
    rollbackAction,
    successMessage,
    errorMessage,
    data
  }) => {
    const operationId = generateOperationId();
    
    // Registrar operação pendente
    setOperations(prev => new Map(prev).set(operationId, {
      type,
      status: OPERATION_STATUS.PENDING,
      data,
      timestamp: Date.now()
    }));

    try {
      // 1. Executar ação otimista (instantânea)
      const optimisticResult = await optimisticAction(data);
      
      // 2. Mostrar toast de sucesso imediato
      const toastId = addToast({
        type: 'success',
        title: '✅ Sucesso',
        message: successMessage,
        duration: 3000
      });

      // 3. Executar chamada API em background
      const apiResult = await apiCall(data);
      
      // 4. Marcar operação como sucesso
      setOperations(prev => {
        const newMap = new Map(prev);
        const op = newMap.get(operationId);
        if (op) {
          newMap.set(operationId, {
            ...op,
            status: OPERATION_STATUS.SUCCESS,
            apiResult,
            optimisticResult,
            completedAt: Date.now()
          });
        }
        return newMap;
      });

      return { success: true, data: apiResult, optimisticResult };

    } catch (error) {
      console.error(`Erro na operação ${type}:`, error);
      
      // 5. Executar rollback
      try {
        await rollbackAction(data, optimisticResult);
        
        // 6. Mostrar toast de erro com opção de retry
        addToast({
          type: 'error',
          title: '❌ Erro',
          message: `${errorMessage}. Alterações desfeitas.`,
          action: {
            label: 'Tentar Novamente',
            onClick: () => executeOptimisticOperation({
              type, optimisticAction, apiCall, rollbackAction, 
              successMessage, errorMessage, data
            })
          },
          duration: 8000
        });

        // 7. Marcar como rolled back
        setOperations(prev => {
          const newMap = new Map(prev);
          const op = newMap.get(operationId);
          if (op) {
            newMap.set(operationId, {
              ...op,
              status: OPERATION_STATUS.ROLLED_BACK,
              error: error.message,
              rolledBackAt: Date.now()
            });
          }
          return newMap;
        });

      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError);
        
        // Erro crítico - não foi possível fazer rollback
        addToast({
          type: 'critical',
          title: '🚨 Erro Crítico',
          message: 'Falha na operação e não foi possível reverter. Verifique manualmente.',
          duration: 0 // Não remove automaticamente
        });

        setOperations(prev => {
          const newMap = new Map(prev);
          const op = newMap.get(operationId);
          if (op) {
            newMap.set(operationId, {
              ...op,
              status: OPERATION_STATUS.ERROR,
              error: error.message,
              rollbackError: rollbackError.message,
              failedAt: Date.now()
            });
          }
          return newMap;
        });
      }

      return { success: false, error: error.message };
    }
  }, [generateOperationId, addToast]);

  /**
   * Operação otimista para criar tarefa
   */
  const createTaskOptimistic = useCallback(async (taskData, { createTask, updateLocalTasks }) => {
    return executeOptimisticOperation({
      type: OPERATION_TYPES.CREATE,
      optimisticAction: async (data) => {
        // Criar tarefa localmente com ID temporário
        const tempTask = {
          ...data,
          id: `temp_${Date.now()}`,
          status: 'pendente',
          created_at: new Date().toISOString(),
          optimistic: true
        };
        
        updateLocalTasks(prev => [...prev, tempTask]);
        return tempTask;
      },
      apiCall: createTask,
      rollbackAction: async (data, optimisticResult) => {
        // Remover tarefa temporária
        updateLocalTasks(prev => prev.filter(t => t.id !== optimisticResult.id));
      },
      successMessage: 'Tarefa criada com sucesso!',
      errorMessage: 'Erro ao criar tarefa',
      data: taskData
    });
  }, [executeOptimisticOperation]);

  /**
   * Operação otimista para atualizar tarefa
   */
  const updateTaskOptimistic = useCallback(async (taskId, updates, { updateTask, updateLocalTasks }) => {
    const originalTasks = updateLocalTasks(prev => prev); // Capturar estado original
    
    return executeOptimisticOperation({
      type: OPERATION_TYPES.UPDATE,
      optimisticAction: async (data) => {
        updateLocalTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates, optimistic: true } : task
        ));
        return { taskId, updates };
      },
      apiCall: () => updateTask(taskId, updates),
      rollbackAction: async () => {
        // Restaurar estado original
        updateLocalTasks(() => originalTasks);
      },
      successMessage: 'Tarefa atualizada com sucesso!',
      errorMessage: 'Erro ao atualizar tarefa',
      data: { taskId, updates }
    });
  }, [executeOptimisticOperation]);

  /**
   * Operação otimista para deletar tarefa
   */
  const deleteTaskOptimistic = useCallback(async (taskId, { deleteTask, updateLocalTasks }) => {
    const originalTask = updateLocalTasks(prev => prev.find(t => t.id === taskId));
    
    return executeOptimisticOperation({
      type: OPERATION_TYPES.DELETE,
      optimisticAction: async () => {
        updateLocalTasks(prev => prev.filter(task => task.id !== taskId));
        return { taskId, deletedTask: originalTask };
      },
      apiCall: () => deleteTask(taskId),
      rollbackAction: async (data, optimisticResult) => {
        // Restaurar tarefa deletada
        if (optimisticResult.deletedTask) {
          updateLocalTasks(prev => [...prev, optimisticResult.deletedTask]);
        }
      },
      successMessage: 'Tarefa excluída com sucesso!',
      errorMessage: 'Erro ao excluir tarefa',
      data: { taskId }
    });
  }, [executeOptimisticOperation]);

  /**
   * Operação otimista para toggle status
   */
  const toggleTaskOptimistic = useCallback(async (taskId, { toggleTask, updateLocalTasks }) => {
    const originalTasks = updateLocalTasks(prev => prev);
    
    return executeOptimisticOperation({
      type: OPERATION_TYPES.TOGGLE,
      optimisticAction: async () => {
        updateLocalTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: task.status === 'pendente' ? 'concluída' : 'pendente',
                optimistic: true 
              } 
            : task
        ));
        return { taskId };
      },
      apiCall: () => toggleTask(taskId),
      rollbackAction: async () => {
        updateLocalTasks(() => originalTasks);
      },
      successMessage: 'Status da tarefa atualizado!',
      errorMessage: 'Erro ao atualizar status',
      data: { taskId }
    });
  }, [executeOptimisticOperation]);

  /**
   * Limpa operações concluídas antigas
   */
  const cleanupOldOperations = useCallback(() => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    setOperations(prev => {
      const cleaned = new Map();
      prev.forEach((op, id) => {
        if (op.status === OPERATION_STATUS.PENDING || 
            (op.completedAt || op.rolledBackAt || op.failedAt) > fiveMinutesAgo) {
          cleaned.set(id, op);
        }
      });
      return cleaned;
    });
  }, []);

  // Limpar operações antigas periodicamente
  useState(() => {
    const interval = setInterval(cleanupOldOperations, 60000); // A cada minuto
    return () => clearInterval(interval);
  });

  return {
    // Estado
    operations,
    toastNotifications,
    
    // Ações otimistas
    createTaskOptimistic,
    updateTaskOptimistic,
    deleteTaskOptimistic,
    toggleTaskOptimistic,
    
    // Toast
    addToast,
    removeToast,
    
    // Utilitários
    cleanupOldOperations,
    
    // Status
    hasPendingOperations: Array.from(operations.values()).some(op => op.status === OPERATION_STATUS.PENDING)
  };
}
