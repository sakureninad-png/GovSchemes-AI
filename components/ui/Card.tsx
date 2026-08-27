import React from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
    variant?: CardVariant;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

interface CardSubProps {
    className?: string;
    children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
    default:
        'bg-surface shadow-sm border border-border-light hover:shadow-md',
    elevated:
        'bg-surface shadow-md hover:shadow-lg hover:-translate-y-0.5',
    outlined:
        'bg-surface border-2 border-border hover:border-primary-light hover:shadow-sm',
};

export function Card({
    variant = 'default',
    className = '',
    children,
    onClick,
}: CardProps) {
    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            className={`
        rounded-xl p-0 overflow-hidden
        transition-all duration-200 ease-in-out
        ${onClick ? 'cursor-pointer w-full text-left' : ''}
        ${variantStyles[variant]}
        ${className}
      `}
            onClick={onClick}
            {...(onClick && { type: 'button' as const })}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ className = '', children }: CardSubProps) {
    return (
        <div className={`px-6 pt-6 pb-2 ${className}`}>
            {children}
        </div>
    );
}

export function CardBody({ className = '', children }: CardSubProps) {
    return (
        <div className={`px-6 py-3 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ className = '', children }: CardSubProps) {
    return (
        <div
            className={`px-6 pb-6 pt-2 border-t border-border-light mt-2 ${className}`}
        >
            {children}
        </div>
    );
}
