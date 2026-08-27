// ==========================================
// Fairness Audit Framework
// Feature 4: Demographic parity analysis + metrics
// ==========================================

import type {
    UserProfile,
    Scheme,
    DemographicGroup,
    GroupMetrics,
    FairnessReport,
    SoftMatchResult,
} from './types';
import { softMatchSchemes } from './soft-matcher';

// ==========================================
// Synthetic Profile Generation
// ==========================================

const GENDERS = ['male', 'female', 'other'] as const;
const CASTE_CATEGORIES = ['general', 'OBC', 'SC', 'ST'] as const;
const INCOME_CATEGORIES = ['BPL', 'APL', 'EWS', 'general'] as const;
const REPRESENTATIVE_STATES = [
    'Maharashtra', 'Uttar Pradesh', 'Kerala', 'Bihar', 'Karnataka',
] as const;

const INCOME_MAP: Record<string, number> = {
    BPL: 80000,
    APL: 250000,
    EWS: 150000,
    general: 500000,
};

/**
 * Generate a grid of synthetic user profiles spanning all demographic combinations.
 * Used for auditing recommendation fairness across groups.
 */
export function generateDemographicGrid(): UserProfile[] {
    const profiles: UserProfile[] = [];
    let id = 0;

    for (const gender of GENDERS) {
        for (const caste of CASTE_CATEGORIES) {
            for (const income of INCOME_CATEGORIES) {
                for (const state of REPRESENTATIVE_STATES) {
                    id++;
                    profiles.push({
                        id: `synth_${id}`,
                        name: `SyntheticUser_${id}`,
                        age: 30, // representative working-age adult
                        gender,
                        state,
                        annualIncome: INCOME_MAP[income],
                        incomeCategory: income,
                        employmentType: 'salaried',
                        casteCategory: caste,
                        isDisabled: false,
                        isWidow: false,
                        isSeniorCitizen: false,
                        isStudent: false,
                        isFarmer: false,
                        isMinority: false,
                        educationLevel: 'graduate',
                        hasRationCard: income === 'BPL',
                        familySize: 4,
                    });
                }
            }
        }
    }

    return profiles;
}

/**
 * Load user profiles from a CSV-like array of objects (for real data audits).
 */
export function loadProfilesFromData(data: Partial<UserProfile>[]): UserProfile[] {
    return data.map((d, i) => ({
        id: d.id || `csv_${i}`,
        name: d.name || `User_${i}`,
        age: d.age || 30,
        gender: (d.gender as UserProfile['gender']) || 'male',
        state: d.state || 'Maharashtra',
        annualIncome: d.annualIncome || 200000,
        incomeCategory: (d.incomeCategory as UserProfile['incomeCategory']) || 'general',
        employmentType: (d.employmentType as UserProfile['employmentType']) || 'salaried',
        casteCategory: (d.casteCategory as UserProfile['casteCategory']) || 'general',
        isDisabled: d.isDisabled || false,
        isWidow: d.isWidow || false,
        isSeniorCitizen: d.isSeniorCitizen || (d.age ? d.age >= 60 : false),
        isStudent: d.isStudent || false,
        isFarmer: d.isFarmer || false,
        isMinority: d.isMinority || false,
        educationLevel: (d.educationLevel as UserProfile['educationLevel']) || 'graduate',
        hasRationCard: d.hasRationCard || false,
        familySize: d.familySize || 4,
    }));
}

// ==========================================
// Group Metrics Computation
// ==========================================

/**
 * Group profiles and compute per-group recommendation metrics.
 */
export function computeGroupMetrics(
    profiles: UserProfile[],
    schemes: Scheme[],
    groupBy: 'gender' | 'casteCategory' | 'incomeCategory' | 'state' = 'casteCategory'
): GroupMetrics[] {
    // Group profiles
    const groups = new Map<string, UserProfile[]>();

    for (const profile of profiles) {
        const key = String(profile[groupBy]);
        const existing = groups.get(key) || [];
        existing.push(profile);
        groups.set(key, existing);
    }

    // Compute metrics per group
    const metrics: GroupMetrics[] = [];

    for (const [groupValue, groupProfiles] of groups.entries()) {
        let totalSchemes = 0;
        let totalScore = 0;
        let totalBenefit = 0;
        let totalSchemesInCatalog = schemes.filter(s => s.isActive).length;

        const schemesAccessibleSet = new Set<string>();

        for (const profile of groupProfiles) {
            const results = softMatchSchemes(profile, schemes);
            const eligible = results.filter(r => r.isEligible);

            totalSchemes += eligible.length;
            totalScore += eligible.reduce((sum, r) => sum + r.compositeScore, 0) / Math.max(eligible.length, 1);

            for (const r of eligible) {
                schemesAccessibleSet.add(r.scheme.id);
                totalBenefit += r.scheme.benefitAmount || 0;
            }
        }

        const profileCount = groupProfiles.length;

        metrics.push({
            group: {
                [groupBy]: groupValue,
                label: `${groupBy}: ${groupValue}`,
            } as DemographicGroup,
            avgSchemesRecommended: totalSchemes / profileCount,
            avgCompositeScore: totalScore / profileCount,
            avgBenefitAmount: totalBenefit / profileCount,
            coverageRate: (schemesAccessibleSet.size / Math.max(totalSchemesInCatalog, 1)) * 100,
            profileCount,
        });
    }

    return metrics;
}

// ==========================================
// Fairness Metrics
// ==========================================

/**
 * Compute the Gini coefficient for a set of values.
 * 0 = perfect equality, 1 = perfect inequality.
 */
export function computeGiniCoefficient(values: number[]): number {
    if (values.length <= 1) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;

    if (mean === 0) return 0;

    let sumAbsDiff = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumAbsDiff += Math.abs(sorted[i] - sorted[j]);
        }
    }

    return sumAbsDiff / (2 * n * n * mean);
}

/**
 * Generate a comprehensive fairness report across multiple demographic axes.
 */
export function generateFairnessReport(
    profiles: UserProfile[],
    schemes: Scheme[]
): FairnessReport {
    const axes: Array<'gender' | 'casteCategory' | 'incomeCategory'> = [
        'gender', 'casteCategory', 'incomeCategory',
    ];

    const allGroupMetrics: GroupMetrics[] = [];
    const recommendations: string[] = [];

    for (const axis of axes) {
        const metrics = computeGroupMetrics(profiles, schemes, axis);
        allGroupMetrics.push(...metrics);

        // Check for disparities on this axis
        const coverages = metrics.map(m => m.coverageRate);
        const minCov = Math.min(...coverages);
        const maxCov = Math.max(...coverages);
        const disparity = maxCov > 0 ? (maxCov - minCov) / maxCov : 0;

        if (disparity > 0.2) {
            const underserved = metrics.find(m => m.coverageRate === minCov);
            const overserved = metrics.find(m => m.coverageRate === maxCov);
            recommendations.push(
                `${axis}: ${underserved?.group.label} has ${minCov.toFixed(1)}% coverage vs. ` +
                `${overserved?.group.label} at ${maxCov.toFixed(1)}% (${(disparity * 100).toFixed(1)}% disparity)`
            );
        }
    }

    // Compute overall metrics
    const allCoverages = allGroupMetrics.map(m => m.coverageRate);
    const allBenefits = allGroupMetrics.map(m => m.avgBenefitAmount);

    const minCoverage = Math.min(...allCoverages);
    const maxCoverage = Math.max(...allCoverages);

    return {
        timestamp: new Date().toISOString(),
        totalProfiles: profiles.length,
        totalSchemes: schemes.filter(s => s.isActive).length,
        groupMetrics: allGroupMetrics,
        demographicParityRatio: maxCoverage > 0 ? minCoverage / maxCoverage : 1,
        giniCoefficient: computeGiniCoefficient(allBenefits),
        coverageDisparity: maxCoverage > 0 ? (maxCoverage - minCoverage) / maxCoverage : 0,
        recommendations,
    };
}
