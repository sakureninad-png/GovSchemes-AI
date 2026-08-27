'use client';

import React from 'react';
import { Lightbulb, ArrowRight, Lock, Clock, CheckCircle2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Counterfactual } from '@/lib/types';

interface CounterfactualCardProps {
    counterfactuals: Counterfactual[];
    schemeName: string;
}

const mutabilityConfig = {
    easy: {
        icon: CheckCircle2,
        label: 'Easy Change',
        variant: 'success' as const,
        bgClass: 'bg-success-50/50',
        borderClass: 'border-success-200',
        barColor: 'bg-success',
    },
    costly: {
        icon: Clock,
        label: 'Requires Effort',
        variant: 'warning' as const,
        bgClass: 'bg-warning-50/50',
        borderClass: 'border-warning-200',
        barColor: 'bg-warning',
    },
    immutable: {
        icon: Lock,
        label: 'Not Changeable',
        variant: 'danger' as const,
        bgClass: 'bg-bg-secondary',
        borderClass: 'border-border-light',
        barColor: 'bg-text-muted',
    },
};

export default function CounterfactualCard({
    counterfactuals,
    schemeName,
}: CounterfactualCardProps) {
    if (counterfactuals.length === 0) return null;

    const actionable = counterfactuals.filter(cf => cf.isActionable);
    const immutable = counterfactuals.filter(cf => !cf.isActionable);

    return (
        <section className="mb-6 bg-surface rounded-2xl border border-border-light p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-text mb-1 flex items-center gap-2">
                <Lightbulb size={18} className="text-warning" />
                What Would Make You Eligible?
            </h2>
            <p className="text-sm text-text-muted mb-4">
                {actionable.length > 0
                    ? `${actionable.length} actionable change${actionable.length > 1 ? 's' : ''} found to improve your eligibility.`
                    : 'No actionable changes available for this scheme.'}
            </p>

            <div className="space-y-3">
                {/* Actionable counterfactuals first */}
                {actionable.map((cf, i) => (
                    <CounterfactualItem key={`action-${i}`} cf={cf} />
                ))}

                {/* Immutable constraints */}
                {immutable.length > 0 && (
                    <>
                        {actionable.length > 0 && (
                            <div className="border-t border-border-light my-3" />
                        )}
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                            Cannot be changed
                        </p>
                        {immutable.map((cf, i) => (
                            <CounterfactualItem key={`immut-${i}`} cf={cf} />
                        ))}
                    </>
                )}
            </div>
        </section>
    );
}

function CounterfactualItem({ cf }: { cf: Counterfactual }) {
    const config = mutabilityConfig[cf.mutability];
    const Icon = config.icon;

    return (
        <div
            className={`
                flex items-start gap-3 p-3.5 rounded-xl border
                ${config.bgClass} ${config.borderClass}
                transition-all duration-200
            `}
        >
            <div className="shrink-0 mt-0.5">
                <Icon size={16} className={`text-${cf.mutability === 'easy' ? 'success' : cf.mutability === 'costly' ? 'warning' : 'text-muted'}`} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text">
                        {cf.displayName}
                    </span>
                    <Badge variant={config.variant} size="sm">
                        {config.label}
                    </Badge>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">
                    {cf.changeDescription}
                </p>

                {/* Current → Required */}
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                    <span className="px-2 py-0.5 bg-bg rounded">{cf.currentValue}</span>
                    <ArrowRight size={12} />
                    <span className="px-2 py-0.5 bg-bg rounded font-medium">{cf.requiredValue}</span>
                </div>

                {/* Actionability bar */}
                {cf.isActionable && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${config.barColor} transition-all duration-500`}
                                style={{ width: `${Math.round(cf.actionabilityScore * 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-text-muted">
                            {Math.round(cf.actionabilityScore * 100)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
