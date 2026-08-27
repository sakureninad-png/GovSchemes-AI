'use client';

import React from 'react';
import { Scale } from 'lucide-react';

interface FairnessBadgeProps {
    show: boolean;
}

/**
 * Small badge indicating a scheme was promoted by the fairness re-ranker.
 * Displayed on SchemeCard for transparency.
 */
export default function FairnessBadge({ show }: FairnessBadgeProps) {
    if (!show) return null;

    return (
        <span
            className="
                inline-flex items-center gap-1
                px-2 py-0.5
                text-[10px] font-medium
                text-primary bg-primary-50
                rounded-full border border-primary-200
            "
            title="This scheme was promoted by the fairness-aware re-ranker to ensure equitable coverage across demographic groups"
        >
            <Scale size={10} />
            Fair
        </span>
    );
}
