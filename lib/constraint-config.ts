// ==========================================
// Constraint Configuration — Hard vs Soft + Decay Parameters
// Used by soft-matcher.ts and counterfactual.ts
// ==========================================

import type { ConstraintType, DecayFunction, AttributeMutability } from './types';

export interface ConstraintConfig {
    type: ConstraintType;
    decayFunction: DecayFunction;
    decayRate: number;      // steepness of decay curve
    weight: number;         // importance weight 0.0–1.0
}

/**
 * Configuration for each eligibility criterion.
 *
 * Hard constraints: binary pass/fail — failing disqualifies entirely.
 *   (gender, caste, state, disability, widow, student, farmer, minority)
 *
 * Soft constraints: continuous scoring via decay functions — near-misses
 *   still receive partial credit.
 *   (age, income, incomeCategory, employmentType, seniorCitizen, rationCard)
 */
export const CONSTRAINT_CONFIGS: Record<string, ConstraintConfig> = {
    // --- Soft constraints (continuous scoring) ---
    age: {
        type: 'soft',
        decayFunction: 'exponential',
        decayRate: 0.1,
        weight: 0.8,
    },
    income: {
        type: 'soft',
        decayFunction: 'linear',
        decayRate: 0.05,
        weight: 0.9,
    },
    incomeCategory: {
        type: 'soft',
        decayFunction: 'step',
        decayRate: 0.5,
        weight: 0.7,
    },
    employmentType: {
        type: 'soft',
        decayFunction: 'step',
        decayRate: 0.5,
        weight: 0.6,
    },
    seniorCitizen: {
        type: 'soft',
        decayFunction: 'sigmoid',
        decayRate: 0.2,
        weight: 0.7,
    },
    rationCard: {
        type: 'soft',
        decayFunction: 'step',
        decayRate: 0.3,
        weight: 0.5,
    },

    // --- Hard constraints (binary pass/fail) ---
    gender: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    casteCategory: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    state: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    disability: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    widow: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    student: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    farmer: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
    minority: {
        type: 'hard',
        decayFunction: 'step',
        decayRate: 1.0,
        weight: 1.0,
    },
};

/**
 * Attribute mutability taxonomy for counterfactual explanations.
 *
 * - immutable: cannot be changed (age, gender, caste)
 * - costly: can be changed but requires significant effort (education, employment)
 * - easy: can be obtained relatively easily (ration card, documentation)
 */
export const ATTRIBUTE_MUTABILITY: Record<string, AttributeMutability> = {
    // Immutable — user cannot change these
    age: 'immutable',
    gender: 'immutable',
    casteCategory: 'immutable',
    isMinority: 'immutable',
    isDisabled: 'immutable',
    isWidow: 'immutable',
    isSeniorCitizen: 'immutable',
    familySize: 'immutable',

    // Costly — possible but requires significant effort/time
    state: 'costly',
    annualIncome: 'costly',
    incomeCategory: 'costly',
    employmentType: 'costly',
    educationLevel: 'costly',
    isStudent: 'costly',
    isFarmer: 'costly',

    // Easy — can be obtained with documentation
    hasRationCard: 'easy',
    rationCardType: 'easy',
};

/**
 * Display names for profile attributes (used in counterfactual explanations).
 */
export const ATTRIBUTE_DISPLAY_NAMES: Record<string, string> = {
    age: 'Age',
    gender: 'Gender',
    state: 'State of Residence',
    annualIncome: 'Annual Income',
    incomeCategory: 'Income Category',
    employmentType: 'Employment Type',
    casteCategory: 'Caste Category',
    isDisabled: 'Disability Status',
    isWidow: 'Widow Status',
    isSeniorCitizen: 'Senior Citizen Status',
    isStudent: 'Student Status',
    isFarmer: 'Farmer Status',
    isMinority: 'Minority Status',
    hasRationCard: 'Ration Card',
    rationCardType: 'Ration Card Type',
    educationLevel: 'Education Level',
    familySize: 'Family Size',
};

// Near-miss threshold: schemes scoring above this are included as near-misses
export const NEAR_MISS_COMPOSITE_THRESHOLD = 40;

// Minimum number of hard constraints that must pass for near-miss inclusion
export const NEAR_MISS_MAX_HARD_FAILURES = 1;
