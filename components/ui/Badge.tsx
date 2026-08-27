import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
    children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-primary-100 text-primary-dark',
    success: 'bg-success-50 text-success-dark',
    warning: 'bg-warning-50 text-warning-dark',
    danger: 'bg-danger-50 text-danger-dark',
    info: 'bg-primary-50 text-primary-light',
};

const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
};

export default function Badge({
    variant = 'default',
    size = 'md',
    className = '',
    children,
}: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center
        font-medium rounded-full
        whitespace-nowrap
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}
