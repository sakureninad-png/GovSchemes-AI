// ==========================================
// Hybrid Neural-Symbolic Soft Constraint Matcher
// Feature 1: Replaces binary pass/fail with continuous scoring
// ==========================================

import type { UserProfile, Scheme, ConstraintScore, SoftMatchResult } from './types';
import {
    CONSTRAINT_CONFIGS,
    NEAR_MISS_COMPOSITE_THRESHOLD,
    NEAR_MISS_MAX_HARD_FAILURES,
} from './constraint-config';
import type { ConstraintConfig } from './constraint-config';

// ==========================================
// Decay Functions
// ==========================================

/**
 * Compute a continuous score in [0, 1] based on distance from threshold.
 * distance = 0 means exactly at threshold (score = 1).
 * As distance increases, score decays toward 0.
 */
function applyDecay(
    normalizedDistance: number,
    config: ConstraintConfig
): number {
    const d = Math.abs(normalizedDistance);

    switch (config.decayFunction) {
        case 'linear':
            // Linear decay: score = max(0, 1 - rate * distance)
            return Math.max(0, 1 - config.decayRate * d);

        case 'exponential':
            // Exponential decay: score = exp(-rate * distance)
            return Math.exp(-config.decayRate * d);

        case 'sigmoid':
            // Sigmoid decay: smooth transition around threshold
            // score = 1 / (1 + exp(rate * (distance - 5)))
            return 1 / (1 + Math.exp(config.decayRate * (d - 5)));

        case 'step':
            // Binary step: pass = 1.0, fail = partial credit based on rate
            return d === 0 ? 1.0 : (1 - config.decayRate);

        default:
            return d === 0 ? 1.0 : 0.0;
    }
}

// ==========================================
// Per-Criterion Soft Evaluation
// ==========================================

function evaluateAgeSoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (elig.minAge === undefined && elig.maxAge === undefined) return null;

    const config = CONSTRAINT_CONFIGS.age;
    const minAge = elig.minAge ?? 0;
    const maxAge = elig.maxAge ?? 150;

    let distance = 0;
    let passed = true;

    if (profile.age < minAge) {
        distance = minAge - profile.age;
        passed = false;
    } else if (profile.age > maxAge) {
        distance = profile.age - maxAge;
        passed = false;
    }

    const softScore = passed ? 1.0 : applyDecay(distance, config);

    return {
        criterionName: 'age',
        constraintType: config.type,
        passed,
        softScore,
        distance: passed ? 0 : distance,
        threshold: `${minAge}–${maxAge === 150 ? '∞' : maxAge}`,
        userValue: String(profile.age),
        displayMessage: passed
            ? `Age ${profile.age} is within ${minAge}–${maxAge === 150 ? '∞' : maxAge} range`
            : `Age must be ${minAge}–${maxAge === 150 ? '∞' : maxAge} (yours: ${profile.age})`,
    };
}

function evaluateGenderSoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (!elig.gender || elig.gender === 'any') return null;

    const config = CONSTRAINT_CONFIGS.gender;
    const passed = profile.gender === elig.gender;

    return {
        criterionName: 'gender',
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : 0.0,
        userValue: profile.gender,
        threshold: elig.gender,
        displayMessage: passed
            ? `Gender: ${elig.gender} required`
            : `Only for ${elig.gender} applicants`,
    };
}

function evaluateIncomeSoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (elig.maxAnnualIncome === undefined) return null;

    const config = CONSTRAINT_CONFIGS.income;
    const passed = profile.annualIncome <= elig.maxAnnualIncome;

    let softScore = 1.0;
    let distance = 0;

    if (!passed) {
        distance = profile.annualIncome - elig.maxAnnualIncome;
        // Normalize distance relative to the threshold for meaningful decay
        const normalizedDist = distance / Math.max(elig.maxAnnualIncome, 1);
        softScore = applyDecay(normalizedDist * 10, config); // scale for linear decay
    }

    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    return {
        criterionName: 'income',
        constraintType: config.type,
        passed,
        softScore,
        distance: passed ? 0 : distance,
        threshold: fmt(elig.maxAnnualIncome),
        userValue: fmt(profile.annualIncome),
        displayMessage: passed
            ? `Income ${fmt(profile.annualIncome)} is below ${fmt(elig.maxAnnualIncome)} limit`
            : `Income must be below ${fmt(elig.maxAnnualIncome)} (yours: ${fmt(profile.annualIncome)})`,
    };
}

function evaluateIncomeCategorySoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (!elig.incomeCategoryAllowed || elig.incomeCategoryAllowed.length === 0) return null;

    const config = CONSTRAINT_CONFIGS.incomeCategory;
    const passed = elig.incomeCategoryAllowed.includes(profile.incomeCategory);

    return {
        criterionName: 'incomeCategory',
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : applyDecay(1, config),
        userValue: profile.incomeCategory,
        threshold: elig.incomeCategoryAllowed.join('/'),
        displayMessage: passed
            ? `${profile.incomeCategory} category is eligible`
            : `Only for ${elig.incomeCategoryAllowed.join('/')} categories`,
    };
}

function evaluateCasteCategorySoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (!elig.casteCategoryAllowed || elig.casteCategoryAllowed.length === 0) return null;

    const config = CONSTRAINT_CONFIGS.casteCategory;
    const passed = elig.casteCategoryAllowed.includes(profile.casteCategory);

    return {
        criterionName: 'casteCategory',
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : 0.0,
        userValue: profile.casteCategory,
        threshold: elig.casteCategoryAllowed.join('/'),
        displayMessage: passed
            ? `${profile.casteCategory} caste category is eligible`
            : `Only for ${elig.casteCategoryAllowed.join('/')} categories`,
    };
}

function evaluateStateSoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (!elig.statesApplicable || elig.statesApplicable.length === 0) return null;

    const config = CONSTRAINT_CONFIGS.state;
    const passed = elig.statesApplicable.includes(profile.state);

    return {
        criterionName: 'state',
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : 0.0,
        userValue: profile.state,
        threshold: elig.statesApplicable.join(', '),
        displayMessage: passed
            ? `Available in ${profile.state}`
            : `Not available in ${profile.state}`,
    };
}

function evaluateEmploymentTypeSoft(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore | null {
    const elig = scheme.eligibility;
    if (!elig.employmentTypes || elig.employmentTypes.length === 0) return null;

    const config = CONSTRAINT_CONFIGS.employmentType;
    const passed = elig.employmentTypes.includes(profile.employmentType);

    return {
        criterionName: 'employmentType',
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : applyDecay(1, config),
        userValue: profile.employmentType,
        threshold: elig.employmentTypes.join('/'),
        displayMessage: passed
            ? `${profile.employmentType} employment type qualifies`
            : `Only for ${elig.employmentTypes.join('/')} workers`,
    };
}

function evaluateBooleanSoft(
    criterionName: string,
    configKey: string,
    required: boolean | undefined,
    userValue: boolean,
    passMessage: string,
    failMessage: string
): ConstraintScore | null {
    if (!required) return null;

    const config = CONSTRAINT_CONFIGS[configKey];
    if (!config) return null;

    const passed = userValue === true;

    return {
        criterionName,
        constraintType: config.type,
        passed,
        softScore: passed ? 1.0 : (config.type === 'soft' ? applyDecay(1, config) : 0.0),
        userValue: String(userValue),
        threshold: 'true',
        displayMessage: passed ? passMessage : failMessage,
    };
}

// ==========================================
// Main Soft Matching Logic
// ==========================================

/**
 * Evaluate a user profile against a scheme, returning detailed
 * constraint scores with continuous soft scoring.
 */
export function evaluateSoftEligibility(
    profile: UserProfile,
    scheme: Scheme
): ConstraintScore[] {
    const scores: ConstraintScore[] = [];
    const elig = scheme.eligibility;

    // Evaluate each criterion
    const evaluators: (ConstraintScore | null)[] = [
        evaluateAgeSoft(profile, scheme),
        evaluateGenderSoft(profile, scheme),
        evaluateIncomeSoft(profile, scheme),
        evaluateIncomeCategorySoft(profile, scheme),
        evaluateCasteCategorySoft(profile, scheme),
        evaluateStateSoft(profile, scheme),
        evaluateEmploymentTypeSoft(profile, scheme),
        evaluateBooleanSoft('disability', 'disability', elig.mustBeDisabled, profile.isDisabled,
            'Person with disability', 'Only for persons with disability'),
        evaluateBooleanSoft('widow', 'widow', elig.mustBeWidow, profile.isWidow,
            'Widow status confirmed', 'Only for widows'),
        evaluateBooleanSoft('seniorCitizen', 'seniorCitizen', elig.mustBeSeniorCitizen,
            profile.isSeniorCitizen || profile.age >= 60,
            'Senior citizen (60+)', 'Only for senior citizens (60+)'),
        evaluateBooleanSoft('student', 'student', elig.mustBeStudent, profile.isStudent,
            'Student status confirmed', 'Only for students'),
        evaluateBooleanSoft('farmer', 'farmer', elig.mustBeFarmer, profile.isFarmer,
            'Farmer status confirmed', 'Only for farmers'),
        evaluateBooleanSoft('rationCard', 'rationCard', elig.mustHaveRationCard, profile.hasRationCard,
            'Has ration card', 'Requires ration card'),
        evaluateBooleanSoft('minority', 'minority', elig.isMinority, profile.isMinority,
            'Minority community member', 'Only for minority community members'),
    ];

    for (const score of evaluators) {
        if (score !== null) {
            scores.push(score);
        }
    }

    return scores;
}

/**
 * Compute composite score from constraint scores.
 *
 * Formula:
 *   compositeScore = hardPassRate × weightedSoftAvg × 100
 *
 * Where:
 *   hardPassRate = (all hard constraints pass) ? 1.0 : 0.0 for eligibility
 *                  but partial for near-miss ranking
 *   weightedSoftAvg = Σ(weight_i × softScore_i) / Σ(weight_i)
 */
function computeCompositeScore(constraintScores: ConstraintScore[]): {
    compositeScore: number;
    hardScore: number;
    softScore: number;
    isEligible: boolean;
    hardFailureCount: number;
} {
    if (constraintScores.length === 0) {
        // Universal scheme with no eligibility criteria — still eligible
        // but scored lower (50) so personalized matches rank higher
        return { compositeScore: 50, hardScore: 1, softScore: 1, isEligible: true, hardFailureCount: 0 };
    }

    let totalWeight = 0;
    let weightedSum = 0;
    let hardFailureCount = 0;

    for (const cs of constraintScores) {
        const config = CONSTRAINT_CONFIGS[cs.criterionName];
        const weight = config?.weight ?? 1.0;

        totalWeight += weight;
        weightedSum += weight * cs.softScore;

        if (cs.constraintType === 'hard' && !cs.passed) {
            hardFailureCount++;
        }
    }

    const softScore = totalWeight > 0 ? weightedSum / totalWeight : 1.0;
    const isEligible = hardFailureCount === 0;

    // Hard score: 1.0 if all pass, decays with each failure
    const hardScore = isEligible ? 1.0 : Math.max(0, 1 - (hardFailureCount * 0.3));

    // Composite: hard score factor × soft score average × 100
    const compositeScore = Math.round(hardScore * softScore * 100);

    return { compositeScore, hardScore, softScore, isEligible, hardFailureCount };
}

/**
 * Match a user profile against all schemes using soft constraint scoring.
 * Returns schemes sorted by composite score (highest first).
 * Includes eligible schemes AND near-misses above threshold.
 */
export function softMatchSchemes(
    profile: UserProfile,
    schemes: Scheme[]
): SoftMatchResult[] {
    const results: SoftMatchResult[] = [];

    for (const scheme of schemes) {
        if (!scheme.isActive) continue;

        const constraintScores = evaluateSoftEligibility(profile, scheme);
        const { compositeScore, hardScore, softScore, isEligible, hardFailureCount } =
            computeCompositeScore(constraintScores);

        const matchedCriteria = constraintScores
            .filter(cs => cs.passed)
            .map(cs => cs.displayMessage);

        const missedCriteria = constraintScores
            .filter(cs => !cs.passed)
            .map(cs => cs.displayMessage);

        const isNearMiss = !isEligible && hardFailureCount <= NEAR_MISS_MAX_HARD_FAILURES;

        // Include if eligible, near-miss, or composite score above threshold
        if (isEligible || isNearMiss || compositeScore >= NEAR_MISS_COMPOSITE_THRESHOLD) {
            results.push({
                scheme,
                hardScore,
                softScore,
                compositeScore,
                constraintScores,
                matchedCriteria,
                missedCriteria,
                isNearMiss: !isEligible,
                isEligible,
            });
        }
    }

    // Sort: eligible first (by composite desc), then near-misses (by composite desc)
    // Tiebreaker: schemes with more matched criteria rank higher (more personalized)
    return results.sort((a, b) => {
        if (a.isEligible !== b.isEligible) {
            return a.isEligible ? -1 : 1;
        }
        if (b.compositeScore !== a.compositeScore) {
            return b.compositeScore - a.compositeScore;
        }
        // More matched criteria = more personalized = rank higher
        return b.matchedCriteria.length - a.matchedCriteria.length;
    });
}
