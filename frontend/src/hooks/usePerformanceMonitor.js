import { useEffect, useRef, useCallback, useState } from 'react';
import { logger, usePerformanceLogger } from '../services/performanceLogger';

/**
 * Hook para monitoramento de performance de componentes React
 * Mede tempo de renderização, interações e performance geral
 */

/**
 * Hook principal de performance monitoring
 */
export function usePerformanceMonitor(componentName, options = {}) {
  const {
    trackRender = true,
    trackInteractions = true,
    trackMemory = false,
    logLevel = 'info'
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const interactionTimes = useRef([]);

  // Medir tempo de renderização
  useEffect(() => {
    if (!trackRender) return;

    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    logger.info(`Component Render: ${componentName}`, {
      renderCount: renderCount.current,
      timeSinceLastRender,
      timestamp: now
    }, 'performance');

    // Track memory usage se habilitado
    if (trackMemory && performance.memory) {
      logger.debug(`Memory Usage: ${componentName}`, {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100
      }, 'performance');
    }
  });

  // Medir interações do usuário
  const trackInteraction = useCallback((interactionType, data = {}) => {
    if (!trackInteractions) return;

    const startTime = performance.now();
    
    return {
      end: (additionalData = {}) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        interactionTimes.current.push({
          type: interactionType,
          duration,
          timestamp: endTime,
          data: { ...data, ...additionalData }
        });

        // Manter apenas últimas 50 interações
        if (interactionTimes.current.length > 50) {
          interactionTimes.current = interactionTimes.current.slice(-50);
        }

        logger.info(`User Interaction: ${componentName}`, {
          interactionType,
          duration: Math.round(duration * 100) / 100,
          ...data,
          ...additionalData
        }, 'ui');

        return duration;
      }
    };
  }, [componentName, trackInteractions]);

  // Obter estatísticas do componente
  const getComponentStats = useCallback(() => {
    const avgInteractionTime = interactionTimes.current.length > 0
      ? interactionTimes.current.reduce((sum, interaction) => sum + interaction.duration, 0) / interactionTimes.current.length
      : 0;

    return {
      componentName,
      renderCount: renderCount.current,
      avgInteractionTime: Math.round(avgInteractionTime * 100) / 100,
      totalInteractions: interactionTimes.current.length,
      lastRenderTime: lastRenderTime.current
    };
  }, []);

  return {
    trackInteraction,
    getComponentStats,
    renderCount: renderCount.current
  };
}

/**
 * Hook para medir performance de API calls
 */
export function useApiPerformance() {
  const measureApiCall = useCallback((apiName, apiCall) => {
    return logger.measureApiCall(apiName, apiCall);
  }, []);

  const measureBatchApiCalls = useCallback(async (calls) => {
    const timer = logger.startTimer('batch_api_calls');
    const results = [];

    for (const call of calls) {
      try {
        const result = await measureApiCall(call.name, call.fn);
        results.push({ name: call.name, success: true, result });
      } catch (error) {
        results.push({ name: call.name, success: false, error: error.message });
      }
    }

    timer.end({ 
      totalCalls: calls.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    });

    return results;
  }, [measureApiCall]);

  return {
    measureApiCall,
    measureBatchApiCalls
  };
}

/**
 * Hook para monitorar performance de scroll
 */
export function useScrollPerformance(componentName, threshold = 16) {
  const scrollTimer = useRef(null);
  const scrollCount = useRef(0);
  const lastScrollTime = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      scrollCount.current++;
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTime.current;
      lastScrollTime.current = now;

      // Cancelar timer anterior
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }

      // Iniciar novo timer
      scrollTimer.current = setTimeout(() => {
        logger.debug(`Scroll Performance: ${componentName}`, {
          scrollCount: scrollCount.current,
          timeSinceLastScroll,
          threshold
        }, 'performance');
      }, 100);
    };

    const element = document.getElementById(componentName) || window;
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, [componentName, threshold]);

  return {
    scrollCount: scrollCount.current
  };
}

/**
 * Hook para detectar performance issues
 */
export function usePerformanceDetector() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const checkPerformance = () => {
      const newIssues = [];

      // Verificar uso de memória
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memoryUsage > 0.8) {
          newIssues.push({
            type: 'memory',
            severity: 'warning',
            message: 'Alto uso de memória detectado',
            value: Math.round(memoryUsage * 100)
          });
        }
      }

      // Verificar tempo de resposta
      const navigation = performance.timing;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        if (loadTime > 3000) {
          newIssues.push({
            type: 'load_time',
            severity: 'warning',
            message: 'Tempo de carregamento lento',
            value: Math.round(loadTime)
          });
        }
      }

      // Verificar FPS (se disponível)
      if ('getFPS' in window) {
        const fps = window.getFPS();
        if (fps < 30) {
          newIssues.push({
            type: 'fps',
            severity: 'error',
            message: 'FPS baixo detectado',
            value: Math.round(fps)
          });
        }
      }

      setIssues(newIssues);
    };

    // Verificar performance a cada 5 segundos
    const interval = setInterval(checkPerformance, 5000);
    checkPerformance(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, []);

  return {
    issues,
    hasIssues: issues.length > 0,
    criticalIssues: issues.filter(issue => issue.severity === 'error')
  };
}

/**
 * Hook para profiling de componentes (development only)
 */
export function useProfiler(componentName) {
  if (process.env.NODE_ENV !== 'development') {
    return { profile: () => {}, getProfileData: () => null };
  }

  const profileData = useRef([]);
  const isProfiling = useRef(false);

  const profile = useCallback(() => {
    if (isProfiling.current) return;

    isProfiling.current = true;
    profileData.current = [];

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes(componentName)) {
          profileData.current.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

    // Parar profiling após 10 segundos
    setTimeout(() => {
      observer.disconnect();
      isProfiling.current = false;
      
      logger.info(`Profile Data: ${componentName}`, {
        entries: profileData.current,
        totalEntries: profileData.current.length,
        avgDuration: profileData.current.reduce((sum, entry) => sum + entry.duration, 0) / profileData.current.length
      }, 'performance');
    }, 10000);
  }, [componentName]);

  const getProfileData = useCallback(() => {
    return profileData.current;
  }, []);

  return {
    profile,
    getProfileData,
    isProfiling: isProfiling.current
  };
}

/**
 * Hook para monitorar performance de formulários
 */
export function useFormPerformance(formName) {
  const interactionTimes = useRef([]);
  const fieldInteractions = useRef(new Map());

  const trackFieldInteraction = useCallback((fieldName, interactionType) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        
        if (!fieldInteractions.current.has(fieldName)) {
          fieldInteractions.current.set(fieldName, []);
        }
        
        fieldInteractions.current.get(fieldName).push({
          type: interactionType,
          duration,
          timestamp: Date.now()
        });

        logger.debug(`Form Field: ${formName}.${fieldName}`, {
          interactionType,
          duration: Math.round(duration * 100) / 100
        }, 'ui');
      }
    };
  }, [formName]);

  const getFormStats = useCallback(() => {
    const stats = {
      formName,
      totalFields: fieldInteractions.current.size,
      fieldStats: {}
    };

    fieldInteractions.current.forEach((interactions, fieldName) => {
      const avgDuration = interactions.reduce((sum, interaction) => sum + interaction.duration, 0) / interactions.length;
      
      stats.fieldStats[fieldName] = {
        interactionCount: interactions.length,
        avgDuration: Math.round(avgDuration * 100) / 100,
        lastInteraction: interactions[interactions.length - 1]?.timestamp
      };
    });

    return stats;
  }, [formName]);

  return {
    trackFieldInteraction,
    getFormStats
  };
}
