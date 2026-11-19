'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-[#FAFAFA]">
          <div className="max-w-md w-full bg-white border border-[#E5E5E5] rounded-xl p-8 text-center space-y-4 shadow-sm font-mono">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">
              Rendering Interruption
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              A component error occurred while rendering this view. Your session and data remain safe.
            </p>
            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="text-[10px] text-left p-3 bg-zinc-100 rounded text-red-600 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <Link
                href="/"
                className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#D5D5D5] text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
