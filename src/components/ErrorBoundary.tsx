import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };
  declare props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'Ocurrió un error inesperado.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error) {
        readable = `Error de sincronización (${parsed.operationType}): ${parsed.error}`;
      }
    } catch {
      // Not JSON, keep original message
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg text-slate-200 flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-2">
                Algo salió mal
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed break-words">
                {this.state.message}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-brand-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={15} />
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
