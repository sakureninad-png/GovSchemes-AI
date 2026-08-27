'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-accent text-white hover:bg-accent-dark focus-visible:ring-accent shadow-sm hover:shadow-md',
    secondary:
        'bg-transparent text-primary border-2 border-primary hover:bg-primary-50 focus-visible:ring-primary',
    ghost:
        'bg-transparent text-text-secondary hover:bg-bg-secondary focus-visible:ring-primary',
    danger:
        'bg-danger text-white hover:bg-danger-dark focus-visible:ring-danger shadow-sm hover:shadow-md',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            className={`
        inline-flex items-center justify-center
        font-semibold rounded-lg
        transition-all duration-200 ease-in-out
        cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            aria-busy={isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2
                    className="animate-spin"
                    size={size === 'sm' ? 14 : size === 'md' ? 18 : 22}
                    aria-hidden="true"
                />
            ) : (
                leftIcon && <span aria-hidden="true">{leftIcon}</span>
            )}
            <span>{children}</span>
            {!isLoading && rightIcon && (
                <span aria-hidden="true">{rightIcon}</span>
            )}
        </button>
    );
}
