// ==========================================
// Rule-Based Eligibility Matcher
// Pure TypeScript — no AI, runs instantly
// ==========================================

import type { UserProfile, Scheme } from './types';

export interface MatchResult {
    scheme: Scheme;
    matchScore: number;           // 0-100
    matchedCriteria: string[];    // criteria the user meets
    missedCriteria: string[];     // criteria the user failed (for near-misses)
    isNearMiss: boolean;          // fails only 1 criteria
}

/**
 * Match a user profile against a list of schemes.
 * Returns schemes sorted by match score (highest first).
 * Includes near-miss schemes (fail only 1 criteria).
 */
export function matchSchemes(
    profile: UserProfile,
    schemes: Scheme[]
): MatchResult[] {
    const results: MatchResult[] = [];

    for (const scheme of schemes) {
        if (!scheme.isActive) continue;

        const { matchedCriteria, missedCriteria } = evaluateEligibility(
            profile,
            scheme
        );

        const totalCriteria = matchedCriteria.length + missedCriteria.length;
        const matchScore =
            totalCriteria > 0
                ? Math.round((matchedCriteria.length / totalCriteria) * 100)
                : 100; // No criteria = universal scheme

        const isNearMiss = missedCriteria.length === 1;

        // Include if fully eligible or near-miss
        if (missedCriteria.length === 0 || isNearMiss) {
            results.push({
                scheme,
                matchScore,
                matchedCriteria,
                missedCriteria,
                isNearMiss,
            });
        }
    }

    // Sort: fully matched first (by score desc), then near-misses
    return results.sort((a, b) => {
        if (a.isNearMiss !== b.isNearMiss) {
            return a.isNearMiss ? 1 : -1;
        }
        return b.matchScore - a.matchScore;
    });
}

export function evaluateEligibility(
    profile: UserProfile,
    scheme: Scheme
): { matchedCriteria: string[]; missedCriteria: string[] } {
    const matched: string[] = [];
    const missed: string[] = [];
    const elig = scheme.eligibility;

    // Age check
    if (elig.minAge !== undefined || elig.maxAge !== undefined) {
        const meetsMin = elig.minAge === undefined || profile.age >= elig.minAge;
        const meetsMax = elig.maxAge === undefined || profile.age <= elig.maxAge;
        if (meetsMin && meetsMax) {
            matched.push(`Age ${profile.age} is within ${elig.minAge ?? 0}–${elig.maxAge ?? '∞'} range`);
        } else {
            missed.push(`Age must be ${elig.minAge ?? 0}–${elig.maxAge ?? '∞'} (yours: ${profile.age})`);
        }
    }

    // Gender check
    if (elig.gender && elig.gender !== 'any') {
        if (profile.gender === elig.gender) {
            matched.push(`Gender: ${elig.gender} required`);
        } else {
            missed.push(`Only for ${elig.gender} applicants`);
        }
    }

    // Income check
    if (elig.maxAnnualIncome !== undefined) {
        if (profile.annualIncome <= elig.maxAnnualIncome) {
            matched.push(`Income ₹${profile.annualIncome.toLocaleString('en-IN')} is below ₹${elig.maxAnnualIncome.toLocaleString('en-IN')} limit`);
        } else {
            missed.push(`Income must be below ₹${elig.maxAnnualIncome.toLocaleString('en-IN')} (yours: ₹${profile.annualIncome.toLocaleString('en-IN')})`);
        }
    }

    // Income category check
    if (elig.incomeCategoryAllowed && elig.incomeCategoryAllowed.length > 0) {
        if (elig.incomeCategoryAllowed.includes(profile.incomeCategory)) {
            matched.push(`${profile.incomeCategory} category is eligible`);
        } else {
            missed.push(`Only for ${elig.incomeCategoryAllowed.join('/')} categories`);
        }
    }

    // Caste category check
    if (elig.casteCategoryAllowed && elig.casteCategoryAllowed.length > 0) {
        if (elig.casteCategoryAllowed.includes(profile.casteCategory)) {
            matched.push(`${profile.casteCategory} caste category is eligible`);
        } else {
            missed.push(`Only for ${elig.casteCategoryAllowed.join('/')} categories`);
        }
    }

    // State check
    if (elig.statesApplicable && elig.statesApplicable.length > 0) {
        if (elig.statesApplicable.includes(profile.state)) {
            matched.push(`Available in ${profile.state}`);
        } else {
            missed.push(`Not available in ${profile.state}`);
        }
    }

    // Employment type check
    if (elig.employmentTypes && elig.employmentTypes.length > 0) {
        if (elig.employmentTypes.includes(profile.employmentType)) {
            matched.push(`${profile.employmentType} employment type qualifies`);
        } else {
            missed.push(`Only for ${elig.employmentTypes.join('/')} workers`);
        }
    }

    // Boolean flag checks
    if (elig.mustBeDisabled) {
        if (profile.isDisabled) {
            matched.push('Person with disability');
        } else {
            missed.push('Only for persons with disability');
        }
    }

    if (elig.mustBeWidow) {
        if (profile.isWidow) {
            matched.push('Widow status confirmed');
        } else {
            missed.push('Only for widows');
        }
    }

    if (elig.mustBeSeniorCitizen) {
        if (profile.isSeniorCitizen || profile.age >= 60) {
            matched.push('Senior citizen (60+)');
        } else {
            missed.push('Only for senior citizens (60+)');
        }
    }

    if (elig.mustBeStudent) {
        if (profile.isStudent) {
            matched.push('Student status confirmed');
        } else {
            missed.push('Only for students');
        }
    }

    if (elig.mustBeFarmer) {
        if (profile.isFarmer) {
            matched.push('Farmer status confirmed');
        } else {
            missed.push('Only for farmers');
        }
    }

    if (elig.mustHaveRationCard) {
        if (profile.hasRationCard) {
            matched.push('Has ration card');
        } else {
            missed.push('Requires ration card');
        }
    }

    // Minority check
    if (elig.isMinority) {
        if (profile.isMinority) {
            matched.push('Minority community member');
        } else {
            missed.push('Only for minority community members');
        }
    }

    return { matchedCriteria: matched, missedCriteria: missed };
}
