/**
 * Sistema de Data Logging Profissional
 * Monitoramento de performance para debug e auditoria
 */

// Níveis de log
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Categorias de log
export const LOG_CATEGORIES = {
  PERFORMANCE: 'performance',
  API: 'api',
  UI: 'ui',
  USER_ACTION: 'user_action',
  ERROR: 'error',
  SYSTEM: 'system'
};

/**
 * Logger profissional com buffering e persistência
 */
class PerformanceLogger {
  constructor() {
    this.logs = [];
    this.maxBufferSize = 1000;
    this.currentLogLevel = LOG_LEVELS.DEBUG;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.metrics = new Map();
    this.flushInterval = null;
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Iniciar flush periódico
    this.startPeriodicFlush();
    
    // Capturar erros globais
    this.setupGlobalErrorHandling();
  }

  /**
   * Gera ID único para sessão
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Configura captura de erros globais
   */
  setupGlobalErrorHandling() {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.error('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, LOG_CATEGORIES.SYSTEM);
    });

    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      }, LOG_CATEGORIES.SYSTEM);
    });
  }

  /**
   * Log principal
   */
  log(level, category, message, data = {}, context = {}) {
    if (level < this.currentLogLevel) return;

    const logEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      level,
      category,
      message,
      data: this.sanitizeData(data),
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      memory: this.getMemoryUsage(),
      performance: this.getPerformanceMetrics()
    };

    this.logs.push(logEntry);

    // Manter buffer limitado
    if (this.logs.length > this.maxBufferSize) {
      this.logs = this.logs.slice(-this.maxBufferSize);
    }

    // Em produção, enviar para serviço externo
    if (this.isProduction && level >= LOG_LEVELS.ERROR) {
      this.sendToExternalService(logEntry);
    }

    // Console output para desenvolvimento
    if (!this.isProduction) {
      this.consoleOutput(logEntry);
    }
  }

  /**
   * Métodos de conveniência
   */
  debug(message, data, category = LOG_CATEGORIES.DEBUG) {
    this.log(LOG_LEVELS.DEBUG, category, message, data);
  }

  info(message, data, category = LOG_CATEGORIES.INFO) {
    this.log(LOG_LEVELS.INFO, category, message, data);
  }

  warn(message, data, category = LOG_CATEGORIES.WARN) {
    this.log(LOG_LEVELS.WARN, category, message, data);
  }

  error(message, data, category = LOG_CATEGORIES.ERROR) {
    this.log(LOG_LEVELS.ERROR, category, message, data);
  }

  critical(message, data, category = LOG_CATEGORIES.CRITICAL) {
    this.log(LOG_LEVELS.CRITICAL, category, message, data);
  }

  /**
   * Medição de performance
   */
  startTimer(name, category = LOG_CATEGORIES.PERFORMANCE) {
    const startTime = performance.now();
    
    return {
      end: (data = {}) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.info(`Timer: ${name}`, {
          duration: Math.round(duration * 100) / 100,
          unit: 'ms',
          ...data
        }, category);
        
        return duration;
      }
    };
  }

  /**
   * Medir tempo de renderização de componente
   */
  measureRender(componentName, renderFunction) {
    const timer = this.startTimer(`render_${componentName}`);
    
    try {
      const result = renderFunction();
      timer.end({ component: componentName });
      return result;
    } catch (error) {
      timer.end({ 
        component: componentName, 
        error: error.message,
        failed: true 
      });
      throw error;
    }
  }

  /**
   * Medir tempo de resposta da API
   */
  measureApiCall(apiName, apiCall) {
    const timer = this.startTimer(`api_${apiName}`, LOG_CATEGORIES.API);
    
    return apiCall()
      .then(response => {
        timer.end({ 
          api: apiName, 
          status: response.status,
          success: true 
        });
        return response;
      })
      .catch(error => {
        timer.end({ 
          api: apiName, 
          error: error.message,
          success: false 
        });
        throw error;
      });
  }

  /**
   * Log de ação do usuário
   */
  logUserAction(action, details = {}) {
    this.info(`User Action: ${action}`, details, LOG_CATEGORIES.USER_ACTION);
  }

  /**
   * Gera ID único para log
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitiza dados para evitar problemas
   */
  sanitizeData(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      return { error: 'Failed to serialize data', original: String(data) };
    }
  }

  /**
   * Obtém métricas de memória
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
      };
    }
    return null;
  }

  /**
   * Obtém métricas de performance
   */
  getPerformanceMetrics() {
    if (performance.timing) {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart
      };
    }
    return null;
  }

  /**
   * Output formatado para console
   */
  consoleOutput(logEntry) {
    const styles = {
      [LOG_LEVELS.DEBUG]: 'color: #6B7280',
      [LOG_LEVELS.INFO]: 'color: #3B82F6',
      [LOG_LEVELS.WARN]: 'color: #F59E0B',
      [LOG_LEVELS.ERROR]: 'color: #EF4444',
      [LOG_LEVELS.CRITICAL]: 'color: #DC2626; font-weight: bold'
    };

    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[logEntry.level];
    const style = styles[logEntry.level];

    console.group(
      `%c[${levelName}] ${logEntry.category.toUpperCase()} - ${logEntry.message}`,
      style
    );
    
    console.log('Timestamp:', new Date(logEntry.timestamp).toISOString());
    console.log('Session:', logEntry.sessionId);
    
    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      console.log('Data:', logEntry.data);
    }
    
    if (logEntry.performance) {
      console.log('Performance:', logEntry.performance);
    }
    
    if (logEntry.memory) {
      console.log('Memory:', logEntry.memory);
    }
    
    console.groupEnd();
  }

  /**
   * Envia logs para serviço externo (em produção)
   */
  async sendToExternalService(logEntry) {
    try {
      // Implementar envio para serviço como Datadog, New Relic, etc.
      // Por enquanto, apenas log no console
      console.log('External logging:', logEntry);
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Inicia flush periódico
   */
  startPeriodicFlush() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 60000); // A cada minuto
  }

  /**
   * Faz flush dos logs
   */
  flush() {
    if (this.logs.length === 0) return;

    const logsToFlush = [...this.logs];
    this.logs = [];

    // Em produção, enviar para serviço externo
    if (this.isProduction) {
      this.sendBatchToExternalService(logsToFlush);
    }

    // Salvar no localStorage para debugging
    try {
      const existingLogs = JSON.parse(localStorage.getItem('poweros_logs') || '[]');
      const updatedLogs = [...existingLogs, ...logsToFlush].slice(-500); // Manter apenas 500 mais recentes
      localStorage.setItem('poweros_logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Envia lote de logs para serviço externo
   */
  async sendBatchToExternalService(logs) {
    try {
      // Implementar envio em lote
      console.log('Batch logging:', { count: logs.length, sessionId: this.sessionId });
    } catch (error) {
      console.error('Failed to send batch logs:', error);
    }
  }

  /**
   * Obtém estatísticas da sessão
   */
  getSessionStats() {
    const now = Date.now();
    const sessionDuration = now - this.startTime;
    
    const stats = {
      sessionId: this.sessionId,
      duration: Math.round(sessionDuration / 1000),
      totalLogs: this.logs.length,
      logsByLevel: {},
      logsByCategory: {},
      errors: this.logs.filter(log => log.level >= LOG_LEVELS.ERROR).length,
      avgMemory: this.calculateAverageMemory()
    };

    // Calcular distribuição por nível
    Object.values(LOG_LEVELS).forEach(level => {
      stats.logsByLevel[level] = this.logs.filter(log => log.level === level).length;
    });

    // Calcular distribuição por categoria
    Object.values(LOG_CATEGORIES).forEach(category => {
      stats.logsByCategory[category] = this.logs.filter(log => log.category === category).length;
    });

    return stats;
  }

  /**
   * Calcula média de uso de memória
   */
  calculateAverageMemory() {
    const memoryLogs = this.logs.filter(log => log.memory).map(log => log.memory.used);
    if (memoryLogs.length === 0) return 0;
    
    const sum = memoryLogs.reduce((acc, mem) => acc + mem, 0);
    return Math.round((sum / memoryLogs.length) * 100) / 100;
  }

  /**
   * Exporta logs para arquivo
   */
  exportLogs() {
    const stats = this.getSessionStats();
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessionStats: stats,
      logs: this.logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poweros_logs_${this.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('poweros_logs');
    } catch (error) {
      console.error('Failed to clear logs from localStorage:', error);
    }
  }

  /**
   * Destroi o logger
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Instância global
export const logger = new PerformanceLogger();

// Hook para React
export function usePerformanceLogger() {
  return {
    logger,
    startTimer: (name, category) => logger.startTimer(name, category),
    measureRender: (name, fn) => logger.measureRender(name, fn),
    measureApiCall: (name, fn) => logger.measureApiCall(name, fn),
    logUserAction: (action, details) => logger.logUserAction(action, details),
    getSessionStats: () => logger.getSessionStats(),
    exportLogs: () => logger.exportLogs(),
    clearLogs: () => logger.clearLogs()
  };
}

// Exportar para uso global
window.PowerOSLogger = logger;
