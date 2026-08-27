// ==========================================
// Fairness-Aware Re-Ranker (MMR-based)
// Feature 4: Optimizes for relevance + demographic parity
// ==========================================

import type { EnhancedRecommendation, UserProfile, GroupMetrics } from './types';

export interface FairnessConfig {
    lambda: number;             // 0.0–1.0: tradeoff between relevance and fairness
    enableFairnessBoost: boolean;
    underservedGroups?: string[]; // groups to boost
}

const DEFAULT_FAIRNESS_CONFIG: FairnessConfig = {
    lambda: 0.7,               // 70% relevance, 30% fairness
    enableFairnessBoost: true,
};

// Pre-computed coverage rates by demographic group (approximate baseline)
// These would ideally be computed from the fairness audit, but we use
// reasonable defaults based on the scheme catalog analysis
const BASELINE_COVERAGE: Record<string, number> = {
    // Caste categories (lower coverage = more underserved = higher boost)
    'general': 0.75,
    'OBC': 0.60,
    'SC': 0.55,
    'ST': 0.50,
    // Gender
    'male': 0.65,
    'female': 0.70,  // many schemes target women specifically
    'other': 0.40,
    // Income
    'BPL': 0.80,     // many schemes target BPL
    'EWS': 0.65,
    'APL': 0.45,
    'general_income': 0.35,
};

/**
 * Compute a fairness boost for a recommendation based on the user's
 * demographic group. Underserved groups get a positive boost.
 *
 * boost = (1 - baseline_coverage_for_group) × weight
 */
function computeFairnessBoost(
    userProfile: UserProfile,
): number {
    const casteCoverage = BASELINE_COVERAGE[userProfile.casteCategory] ?? 0.6;
    const genderCoverage = BASELINE_COVERAGE[userProfile.gender] ?? 0.6;
    const incomeCoverage = BASELINE_COVERAGE[userProfile.incomeCategory] ?? 0.5;

    // Average underserved-ness across dimensions
    const avgUnderserved = (
        (1 - casteCoverage) +
        (1 - genderCoverage) +
        (1 - incomeCoverage)
    ) / 3;

    return avgUnderserved;
}

/**
 * MMR-inspired fairness-aware re-ranking.
 *
 * At each step, selects the recommendation that maximizes:
 *   score = λ × relevance + (1-λ) × fairness_gain
 *
 * Where:
 *   - relevance = compositeScore / 100 (normalized)
 *   - fairness_gain = boost for underserved demographic groups +
 *                     diversity bonus for benefit type variety
 *
 * This ensures underserved groups see relevant schemes promoted
 * while maintaining overall recommendation quality.
 */
export function mmrRerank(
    recommendations: EnhancedRecommendation[],
    userProfile: UserProfile,
    config: FairnessConfig = DEFAULT_FAIRNESS_CONFIG
): EnhancedRecommendation[] {
    if (!config.enableFairnessBoost || recommendations.length <= 1) {
        return recommendations;
    }

    const lambda = config.lambda;
    const fairnessBoost = computeFairnessBoost(userProfile);

    // Track selected benefit types for diversity
    const selectedBenefitTypes = new Set<string>();
    const remaining = [...recommendations];
    const reranked: EnhancedRecommendation[] = [];

    while (remaining.length > 0) {
        let bestIdx = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const rec = remaining[i];
            const relevance = rec.compositeScore / 100;

            // Diversity bonus: prefer benefit types not yet in the list
            const diversityBonus = selectedBenefitTypes.has(rec.scheme.benefitType) ? 0 : 0.15;

            // Benefit amount bonus: prioritize high-value schemes for underserved
            const benefitBonus = rec.scheme.benefitAmount
                ? Math.min(0.1, (rec.scheme.benefitAmount / 1000000) * 0.1)
                : 0;

            // Combined fairness gain
            const fairnessGain = fairnessBoost + diversityBonus + benefitBonus;

            // MMR score
            const score = lambda * relevance + (1 - lambda) * fairnessGain;

            if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
            }
        }

        const selected = remaining.splice(bestIdx, 1)[0];
        selected.fairnessAdjusted = true;
        selectedBenefitTypes.add(selected.scheme.benefitType);
        reranked.push(selected);
    }

    return reranked;
}

/**
 * Update the re-ranker with actual group metrics from a fairness audit.
 * This allows using real coverage data instead of the baseline approximations.
 */
export function updateBaselineCoverage(
    groupMetrics: GroupMetrics[]
): void {
    for (const gm of groupMetrics) {
        const group = gm.group;
        if (group.casteCategory) {
            BASELINE_COVERAGE[group.casteCategory] = gm.coverageRate / 100;
        }
        if (group.gender) {
            BASELINE_COVERAGE[group.gender] = gm.coverageRate / 100;
        }
        if (group.incomeCategory) {
            BASELINE_COVERAGE[group.incomeCategory] = gm.coverageRate / 100;
        }
    }
}
