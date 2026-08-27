import React from 'react';

interface PageWrapperProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function PageWrapper({
    children,
    className = '',
    noPadding = false,
}: PageWrapperProps) {
    return (
        <main
            id="main-content"
            className={`
        max-w-7xl mx-auto w-full
        min-h-[calc(100vh-5rem)]
        ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}
        ${className}
      `}
        >
            {children}
        </main>
    );
}
