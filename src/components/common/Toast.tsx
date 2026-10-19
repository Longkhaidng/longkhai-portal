'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, ExternalLink } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'> & { duration?: number }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? (toast.action ? 12000 : 5000);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    []
  );

  return { toasts, showToast, dismissToast };
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-800/80 shadow-emerald-950/30'
                : isError
                ? 'bg-rose-950/90 text-rose-100 border-rose-800/80 shadow-rose-950/30'
                : isWarning
                ? 'bg-amber-950/90 text-amber-100 border-amber-800/80 shadow-amber-950/30'
                : 'bg-slate-900/90 text-slate-100 border-slate-700/80 shadow-slate-950/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <XCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
                {toast.message && (
                  <p className="text-[11px] opacity-90 mt-1 leading-relaxed break-words whitespace-pre-line">
                    {toast.message}
                  </p>
                )}

                {toast.action && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick();
                        onDismiss(toast.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>{toast.action.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 text-white/50 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
