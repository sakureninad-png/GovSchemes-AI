'use client';

import Link from 'next/link';
import {
    Award,
    Building2,
    ArrowRight,
    Bookmark,
    BookmarkCheck,
    AlertTriangle,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import type { Recommendation } from '@/lib/types';

interface SchemeCardProps {
    recommendation: Recommendation;
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-accent';
}

function getScoreRingColor(score: number): string {
    if (score >= 80) return 'border-success';
    if (score >= 60) return 'border-warning';
    return 'border-accent';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-success-50';
    if (score >= 60) return 'bg-warning-50';
    return 'bg-accent-50';
}

const benefitTypeLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'danger' }> = {
    scholarship: { label: 'Scholarship', variant: 'info' },
    subsidy: { label: 'Subsidy', variant: 'success' },
    loan: { label: 'Loan', variant: 'default' },
    insurance: { label: 'Insurance', variant: 'info' },
    pension: { label: 'Pension', variant: 'warning' },
    employment: { label: 'Employment', variant: 'success' },
    housing: { label: 'Housing', variant: 'default' },
    healthcare: { label: 'Healthcare', variant: 'info' },
    other: { label: 'Benefit', variant: 'default' },
};

export default function SchemeCard({ recommendation }: SchemeCardProps) {
    const { saveScheme, unsaveScheme, isSchemeSaved } = useAuth();
    const { scheme, matchScore, aiExplanation, missedCriteria } = recommendation;
    const isNearMiss = missedCriteria.length > 0;
    const benefitInfo = benefitTypeLabels[scheme.benefitType] || benefitTypeLabels.other;
    const saved = isSchemeSaved(scheme.id);

    function handleToggleSave() {
        if (saved) {
            unsaveScheme(scheme.id);
        } else {
            saveScheme(scheme.id);
        }
    }

    return (
        <div
            className={`
        bg-surface rounded-2xl border
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${isNearMiss ? 'border-warning-200 bg-warning-50/30' : 'border-border-light shadow-sm'}
      `}
        >
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    {/* Match Score Ring */}
                    <div
                        className={`
              shrink-0 w-14 h-14 rounded-full
              border-[3px] ${getScoreRingColor(matchScore)} ${getScoreBg(matchScore)}
              flex items-center justify-center
            `}
                        title={`${matchScore}% match`}
                    >
                        <span className={`text-sm font-bold ${getScoreColor(matchScore)}`}>
                            {matchScore}%
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-lg font-semibold text-text leading-snug line-clamp-2">
                                    {scheme.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Building2 size={14} className="text-text-muted shrink-0" aria-hidden="true" />
                                    <p className="text-xs text-text-muted truncate">
                                        {scheme.ministry}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant={benefitInfo.variant} size="sm">
                                {benefitInfo.label}
                            </Badge>
                            <Badge
                                variant={scheme.schemeLevel === 'central' ? 'info' : 'default'}
                                size="sm"
                            >
                                {scheme.schemeLevel === 'central' ? 'Central' : 'State'}
                            </Badge>
                            {isNearMiss && (
                                <Badge variant="warning" size="sm">
                                    Near Miss
                                </Badge>
                            )}
                        </div>

                        {/* AI Explanation */}
                        <p className="text-sm text-text-secondary mt-3 leading-relaxed line-clamp-2">
                            {aiExplanation}
                        </p>

                        {/* Near-miss warning */}
                        {isNearMiss && missedCriteria.length > 0 && (
                            <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-warning-50 border border-warning-200">
                                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
                                <p className="text-xs text-warning-dark">
                                    <strong>Not fully eligible:</strong> {missedCriteria[0]}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light">
                    {scheme.benefitAmount && (
                        <div className="flex items-center gap-1.5">
                            <Award size={14} className="text-primary" aria-hidden="true" />
                            <span className="text-sm font-semibold text-primary">
                                ₹{scheme.benefitAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
                    {!scheme.benefitAmount && <div />}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleSave}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${saved
                                    ? 'text-primary bg-primary-50'
                                    : 'text-text-muted hover:text-primary hover:bg-primary-50'
                                }`}
                            title={saved ? 'Unsave scheme' : 'Save scheme'}
                            aria-label={saved ? `Unsave ${scheme.name}` : `Save ${scheme.name}`}
                        >
                            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                        <Link
                            href={`/scheme/${scheme.id}`}
                            className="
                inline-flex items-center gap-1.5
                px-4 py-2
                text-sm font-medium text-primary
                bg-primary-50 rounded-lg
                hover:bg-primary-100
                transition-colors cursor-pointer
              "
                        >
                            View Details
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
