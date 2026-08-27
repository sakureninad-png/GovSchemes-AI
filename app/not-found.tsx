import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
            <div className="text-center max-w-md">
                <div className="text-7xl font-bold text-primary/20 mb-4" aria-hidden="true">
                    404
                </div>
                <h1 className="text-2xl font-bold text-text mb-2">
                    Page not found
                </h1>
                <p className="text-text-secondary mb-8">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Home size={16} />
                        Go Home
                    </Link>
                    <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent-dark transition-colors"
                    >
                        <Search size={16} />
                        Find Schemes
                    </Link>
                </div>
                <Link
                    href="javascript:history.back()"
                    className="inline-flex items-center gap-1 mt-6 text-sm text-text-muted hover:text-primary transition-colors"
                >
                    <ArrowLeft size={14} />
                    Go back
                </Link>
            </div>
        </div>
    );
}
