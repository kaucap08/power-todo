import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar o Modo Deep Work
 * Implementa Web Notifications API e controle de distrações
 */
export function useDeepWorkMode() {
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const notificationPermissionRef = useRef('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      notificationPermissionRef.current = Notification.permission;
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          notificationPermissionRef.current = permission;
        });
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  /**
   * Inicia uma sessão de Deep Work
   * @param {Object} task - Tarefa atual
   * @param {number} duration - Duração em minutos
   */
  const startSession = useCallback((task, duration = 25) => {
    setCurrentTask(task);
    setTimeRemaining(duration * 60);
    setIsActive(true);
    setIsPaused(false);
    
    // Enviar notificação de início (se permitido)
    if (notificationPermissionRef.current === 'granted') {
      new Notification('🚀 Modo Deep Work Iniciado', {
        body: `Focando em: ${task.title}`,
        icon: '/favicon.ico',
        tag: 'deep-work',
      });
    }
  }, []);

  /**
   * Pausa/retoma a sessão
   */
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  /**
   * Finaliza a sessão atual
   */
  const endSession = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setCurrentTask(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  /**
   * Chamado quando a sessão é completada
   */
  const handleSessionComplete = useCallback(() => {
    // Enviar notificação de conclusão
    if (notificationPermissionRef.current === 'granted') {
      new Notification('🎉 Sessão Concluída!', {
        body: `Parabéns! Você completou o Deep Work para: ${currentTask?.title}`,
        icon: '/favicon.ico',
        tag: 'deep-work-complete',
        requireInteraction: true,
      });
    }

    // Tocar som de conclusão (se disponível)
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignorar erros de autoplay
      });
    } catch (e) {
      // Ignorar erros de áudio
    }

    // Resetar estado
    endSession();
  }, [currentTask, endSession]);

  /**
   * Verifica se o navegador suporta notificações
   */
  const supportsNotifications = useCallback(() => {
    return 'Notification' in window;
  }, []);

  /**
   * Solicita permissão para notificações
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!supportsNotifications()) return false;
    
    try {
      const permission = await Notification.requestPermission();
      notificationPermissionRef.current = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }, [supportsNotifications]);

  /**
   * Formata o tempo restante
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  /**
   * Calcula progresso da sessão
   */
  const getProgress = useCallback(() => {
    if (!currentTask || timeRemaining === 0) return 100;
    const totalTime = (currentTask.tempoEstimado || 25) * 60;
    const elapsed = totalTime - timeRemaining;
    return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  }, [currentTask, timeRemaining]);

  return {
    // Estado
    isActive,
    isPaused,
    currentTask,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    progress: getProgress(),
    
    // Ações
    startSession,
    togglePause,
    endSession,
    
    // Utilitários
    supportsNotifications,
    notificationPermission: notificationPermissionRef.current,
    requestNotificationPermission,
  };
}
