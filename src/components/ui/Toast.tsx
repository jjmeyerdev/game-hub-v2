'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Lock, AlertTriangle, CheckCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const accentColor = isSuccess
    ? 'var(--theme-accent-cyan)'
    : isError
      ? '#ef4444'
      : 'var(--theme-accent-violet)';

  const glowColor = isSuccess
    ? 'var(--theme-glow-cyan)'
    : isError
      ? 'rgba(239, 68, 68, 0.4)'
      : 'var(--theme-glow-violet)';

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        '--accent': accentColor,
        '--glow': glowColor,
      } as React.CSSProperties}
    >
      {/* Scan line effect */}
      <div className="toast-scanline" />

      {/* Corner accents */}
      <div className="toast-corner toast-corner-tl" />
      <div className="toast-corner toast-corner-br" />

      {/* Main content */}
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          {isSuccess && <Lock className="toast-icon" />}
          {isError && <AlertTriangle className="toast-icon" />}
          {toast.type === 'info' && <CheckCircle className="toast-icon" />}
          <div className="toast-icon-ring" />
        </div>

        <div className="toast-text">
          <span className="toast-label">
            {isSuccess ? 'SAVED' : isError ? 'ERROR' : 'INFO'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>

        <button
          onClick={handleDismiss}
          className="toast-close"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="toast-progress-track">
        <div
          className="toast-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style jsx>{`
        .toast-item {
          position: relative;
          min-width: 320px;
          max-width: 420px;
          background: var(--theme-bg-secondary);
          border: 1px solid var(--accent);
          border-radius: 4px;
          overflow: hidden;
          box-shadow:
            0 0 20px var(--glow),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
        }

        .toast-enter {
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-exit {
          animation: toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes toastSlideIn {
          0% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
            filter: blur(4px);
          }
          50% {
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: translateX(0) scale(1);
          }
        }

        @keyframes toastSlideOut {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
            filter: blur(4px);
          }
        }

        .toast-scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 255, 255, 0.03) 50%,
            transparent 100%
          );
          background-size: 100% 4px;
          pointer-events: none;
          opacity: 0.5;
          animation: scanMove 8s linear infinite;
        }

        @keyframes scanMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }

        .toast-corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid var(--accent);
          opacity: 0.8;
        }

        .toast-corner-tl {
          top: -1px;
          left: -1px;
          border-right: none;
          border-bottom: none;
        }

        .toast-corner-br {
          bottom: -1px;
          right: -1px;
          border-left: none;
          border-top: none;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          position: relative;
          z-index: 1;
        }

        .toast-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }

        :global(.toast-icon) {
          width: 18px;
          height: 18px;
          color: var(--accent);
          position: relative;
          z-index: 1;
          animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .toast-icon-ring {
          position: absolute;
          inset: 0;
          border: 1px solid var(--accent);
          border-radius: 50%;
          opacity: 0.3;
          animation: ringPulse 2s ease-in-out infinite;
        }

        @keyframes ringPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.15;
          }
        }

        .toast-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .toast-label {
          font-family: var(--font-family-display);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .toast-message {
          font-size: 13px;
          font-weight: 500;
          color: var(--theme-text-primary);
          line-height: 1.4;
        }

        .toast-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--theme-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toast-close:hover {
          background: var(--theme-hover-bg);
          border-color: var(--theme-border-hover);
          color: var(--theme-text-primary);
        }

        .toast-progress-track {
          height: 2px;
          background: var(--theme-bg-tertiary);
        }

        .toast-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), transparent);
          transition: width 0.1s linear;
          box-shadow: 0 0 8px var(--glow);
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}

        <style jsx>{`
          .toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            display: flex;
            flex-direction: column-reverse;
            gap: 12px;
            z-index: 9999;
            pointer-events: none;
          }

          .toast-container > :global(*) {
            pointer-events: auto;
          }

          @media (max-width: 480px) {
            .toast-container {
              left: 16px;
              right: 16px;
              bottom: 16px;
            }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
}

// Convenience functions for common toast types
export const toast = {
  success: (message: string, duration?: number) => {
    // This will be populated by the hook
  },
  error: (message: string, duration?: number) => {
    // This will be populated by the hook
  },
  info: (message: string, duration?: number) => {
    // This will be populated by the hook
  },
};
