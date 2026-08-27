'use client';

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label: string;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    helperText?: string;
}

export default function Select({
    label,
    options,
    placeholder = 'Select an option',
    error,
    helperText,
    id: externalId,
    className = '',
    ...props
}: SelectProps) {
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

            <div className="relative">
                <select
                    id={id}
                    className={`
            w-full appearance-none
            px-4 py-3 pr-10
            text-base text-text
            bg-surface
            border rounded-lg
            transition-all duration-200 ease-in-out
            cursor-pointer
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
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
                    size={18}
                    aria-hidden="true"
                />
            </div>

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
