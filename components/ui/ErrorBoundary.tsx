'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-[50vh] flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-danger-50 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-danger" />
                        </div>
                        <h2 className="text-xl font-bold text-text mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-text-secondary mb-6">
                            An unexpected error occurred. Please try again or return to the home page.
                        </p>
                        {this.state.error && (
                            <details className="mb-4 text-left">
                                <summary className="text-xs text-text-muted cursor-pointer hover:text-text transition-colors">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-3 bg-bg-secondary rounded-lg text-xs text-danger overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex items-center justify-center gap-3">
                            <Button variant="primary" size="sm" onClick={this.handleRetry}>
                                <RefreshCw size={14} className="mr-1.5" />
                                Try Again
                            </Button>
                            <a href="/">
                                <Button variant="ghost" size="sm">
                                    <Home size={14} className="mr-1.5" />
                                    Home
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
