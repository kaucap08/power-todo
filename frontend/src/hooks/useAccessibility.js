import { useEffect, useCallback } from 'react';

/**
 * Hook para implementar acessibilidade WCAG e navegação por teclado
 * Adiciona aria-labels, atalhos de teclado e foco gerenciado
 */
export function useAccessibility() {
  /**
   * Gerencia foco em elementos interativos
   */
  const manageFocus = useCallback(() => {
    // Adicionar indicadores de foco visíveis
    const style = document.createElement('style');
    style.textContent = `
      *:focus {
        outline: 3px solid #4f46e5 !important;
        outline-offset: 2px !important;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .skip-to-content {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #4f46e5;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
      }
      
      .skip-to-content:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /**
   * Configura atalhos de teclado globais
   */
  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + K para focar na busca
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Pesquisar"]');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + N para nova tarefa
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        const newTaskInput = document.querySelector('input[placeholder*="precisa ser feito"]');
        if (newTaskInput) {
          newTaskInput.focus();
        }
      }

      // Escape para fechar modais
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          if (modal.style.display !== 'none') {
            const closeButton = modal.querySelector('button[aria-label*="Fechar"], button[aria-label*="Close"]');
            if (closeButton) {
              closeButton.click();
            }
          }
        });
      }

      // Tab navigation enhancement
      if (event.key === 'Tab') {
        // Adiciona comportamento especial para trap de foco em modais
        const activeModal = document.querySelector('[role="dialog"]:not([style*="display: none"])');
        if (activeModal) {
          const focusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }

      // Atalhos para energia
      if (event.altKey && event.key >= '1' && event.key <= '3') {
        event.preventDefault();
        const energyLevel = event.key === '1' ? 'baixa' : event.key === '2' ? 'media' : 'alta';
        const energyButtons = document.querySelectorAll('[data-energy-level]');
        energyButtons.forEach(button => {
          if (button.dataset.energyLevel === energyLevel) {
            button.click();
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Adiciona aria-labels dinâmicos
   */
  const enhanceAriaLabels = useCallback(() => {
    // Para botões sem texto claro
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      const icon = button.textContent.trim();
      if (icon && icon.length <= 2) {
        // Provavelmente é um ícone
        let label = '';
        if (icon.includes('🗑️')) label = 'Excluir tarefa';
        else if (icon.includes('✏️')) label = 'Editar tarefa';
        else if (icon.includes('🎯')) label = 'Iniciar modo foco';
        else if (icon.includes('+')) label = 'Adicionar nova tarefa';
        else if (icon.includes('✕')) label = 'Fechar';
        
        if (label) {
          button.setAttribute('aria-label', label);
        }
      }
    });

    // Para inputs sem label
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const placeholder = input.getAttribute('placeholder');
      if (placeholder && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', placeholder);
      }
    });

    // Adicionar landmarks semânticos
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    const aside = document.querySelector('aside');
    if (aside && !aside.getAttribute('role')) {
      aside.setAttribute('role', 'complementary');
    }

    // Adicionar live regions para anúncios dinâmicos
    if (!document.querySelector('[aria-live="polite"]')) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'a11y-announcements';
      document.body.appendChild(liveRegion);
    }
  }, []);

  /**
   * Anuncia mudanças para leitores de tela
   */
  const announce = useCallback((message) => {
    const liveRegion = document.getElementById('a11y-announcements');
    if (liveRegion) {
      liveRegion.textContent = message;
      // Limpar após um tempo
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }, []);

  /**
   * Gerencia foco em novas tarefas adicionadas
   */
  const focusNewElement = useCallback((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      announce(`Novo elemento focado: ${element.getAttribute('aria-label') || 'elemento'}`);
    }
  }, [announce]);

  // Efeito principal para configurar acessibilidade
  useEffect(() => {
    const cleanupFocus = manageFocus();
    const cleanupKeyboard = setupKeyboardShortcuts();
    
    // Configuração inicial
    enhanceAriaLabels();
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(() => {
      enhanceAriaLabels();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'role']
    });

    return () => {
      cleanupFocus();
      cleanupKeyboard();
      observer.disconnect();
    };
  }, [manageFocus, setupKeyboardShortcuts, enhanceAriaLabels]);

  return {
    announce,
    focusNewElement,
    enhanceAriaLabels,
  };
}
