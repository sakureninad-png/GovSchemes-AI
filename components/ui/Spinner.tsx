import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
    label?: string;
}

const sizeMap: Record<SpinnerSize, { dimension: string; border: string }> = {
    sm: { dimension: 'w-4 h-4', border: 'border-2' },
    md: { dimension: 'w-8 h-8', border: 'border-[3px]' },
    lg: { dimension: 'w-12 h-12', border: 'border-4' },
};

export default function Spinner({
    size = 'md',
    className = '',
    label = 'Loading',
}: SpinnerProps) {
    const { dimension, border } = sizeMap[size];

    return (
        <div
            className={`inline-flex items-center justify-center ${className}`}
            role="status"
            aria-label={label}
        >
            <div
                className={`
          ${dimension} ${border}
          border-primary-200
          border-t-primary
          rounded-full
          animate-spin
        `}
            />
            <span className="sr-only">{label}</span>
        </div>
    );
}
