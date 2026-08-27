'use client';

import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

export default function Input({
    label,
    error,
    helperText,
    id: externalId,
    className = '',
    ...props
}: InputProps) {
    const generatedId = useId();
    const id = externalId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);

    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-sm font-medium text-text"
            >
                {label}
                {props.required && (
                    <span className="text-danger ml-1" aria-hidden="true">*</span>
                )}
            </label>

            <input
                id={id}
                className={`
          w-full px-4 py-3
          text-base text-text
          bg-surface
          border rounded-lg
          transition-all duration-200 ease-in-out
          placeholder:text-text-muted
          focus:outline-none focus:ring-3 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-secondary
          ${hasError
                        ? 'border-danger focus:border-danger focus:ring-danger/20'
                        : 'border-border focus:border-primary focus:ring-primary/20'
                    }
          ${className}
        `}
                aria-invalid={hasError}
                aria-describedby={
                    hasError ? errorId : helperText ? helperId : undefined
                }
                {...props}
            />

            {hasError && (
                <p id={errorId} className="text-sm text-danger flex items-center gap-1" role="alert">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                </p>
            )}

            {!hasError && helperText && (
                <p id={helperId} className="text-sm text-text-muted">
                    {helperText}
                </p>
            )}
        </div>
    );
}
