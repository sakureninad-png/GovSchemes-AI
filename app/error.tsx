'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[GlobalError]', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger-50 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-danger" />
                </div>
                <h1 className="text-2xl font-bold text-text mb-2">
                    Something went wrong
                </h1>
                <p className="text-text-secondary mb-6">
                    An unexpected error occurred. This has been logged and we&apos;ll look into it.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Button variant="primary" onClick={reset}>
                        <RefreshCw size={16} className="mr-2" />
                        Try Again
                    </Button>
                    <a href="/">
                        <Button variant="ghost">
                            <Home size={16} className="mr-2" />
                            Go Home
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
