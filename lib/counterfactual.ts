// ==========================================
// Counterfactual Explainability Engine
// Feature 2: "What Would Make You Eligible?"
// Generates actionable explanations for missed criteria
// ==========================================

import type {
    UserProfile,
    Scheme,
    ConstraintScore,
    Counterfactual,
    CounterfactualResult,
} from './types';
import {
    ATTRIBUTE_MUTABILITY,
    ATTRIBUTE_DISPLAY_NAMES,
} from './constraint-config';
import { evaluateSoftEligibility } from './soft-matcher';

/**
 * Compute counterfactual explanations for a user × scheme pair.
 * For each missed criterion, generates the minimal attribute change
 * needed to become eligible, ranked by actionability.
 */
export function computeCounterfactuals(
    profile: UserProfile,
    scheme: Scheme,
    constraintScores?: ConstraintScore[]
): CounterfactualResult {
    // Get constraint scores if not provided
    const scores = constraintScores ?? evaluateSoftEligibility(profile, scheme);

    // Only generate CFs for failed constraints
    const failedScores = scores.filter(cs => !cs.passed);

    const counterfactuals: Counterfactual[] = [];

    for (const cs of failedScores) {
        const cf = generateCounterfactualForCriterion(profile, scheme, cs);
        if (cf) {
            counterfactuals.push(cf);
        }
    }

    // Sort by actionability (easy first, then costly, then immutable)
    const sorted = rankByActionability(counterfactuals);

    const actionable = sorted.filter(cf => cf.isActionable);
    const bestAction = actionable.length > 0
        ? actionable[0].changeDescription
        : (sorted.length > 0 ? `This scheme is restricted: ${sorted[0].changeDescription}` : 'No changes possible');

    return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        counterfactuals: sorted,
        totalActionable: actionable.length,
        bestAction,
    };
}

/**
 * Rank counterfactuals by actionability.
 * Priority: easy > costly > immutable, then by actionabilityScore desc.
 */
export function rankByActionability(counterfactuals: Counterfactual[]): Counterfactual[] {
    const mutabilityOrder: Record<string, number> = {
        easy: 0,
        costly: 1,
        immutable: 2,
    };

    return [...counterfactuals].sort((a, b) => {
        const orderA = mutabilityOrder[a.mutability] ?? 2;
        const orderB = mutabilityOrder[b.mutability] ?? 2;

        if (orderA !== orderB) return orderA - orderB;
        return b.actionabilityScore - a.actionabilityScore;
    });
}

// ==========================================
// Per-Criterion Counterfactual Generation
// ==========================================

function generateCounterfactualForCriterion(
    profile: UserProfile,
    scheme: Scheme,
    cs: ConstraintScore
): Counterfactual | null {
    const elig = scheme.eligibility;

    switch (cs.criterionName) {
        case 'age':
            return generateAgeCF(profile, elig);

        case 'gender':
            return generateGenderCF(profile, elig);

        case 'income':
            return generateIncomeCF(profile, elig);

        case 'incomeCategory':
            return generateIncomeCategoryCF(profile, elig);

        case 'casteCategory':
            return generateCasteCategoryCF(profile, elig);

        case 'state':
            return generateStateCF(profile, elig);

        case 'employmentType':
            return generateEmploymentTypeCF(profile, elig);

        case 'disability':
            return generateBooleanCF('isDisabled', 'Disability Status',
                profile.isDisabled, 'Register as a person with disability');

        case 'widow':
            return generateBooleanCF('isWidow', 'Widow Status',
                profile.isWidow, 'This scheme is restricted to widows');

        case 'seniorCitizen':
            return generateSeniorCitizenCF(profile);

        case 'student':
            return generateBooleanCF('isStudent', 'Student Status',
                profile.isStudent, 'Enroll in an educational institution');

        case 'farmer':
            return generateBooleanCF('isFarmer', 'Farmer Status',
                profile.isFarmer, 'Register as a farmer');

        case 'rationCard':
            return generateRationCardCF(profile);

        case 'minority':
            return generateBooleanCF('isMinority', 'Minority Status',
                profile.isMinority, 'This scheme is restricted to minority communities');

        default:
            return null;
    }
}

function generateAgeCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const minAge = elig.minAge ?? 0;
    const maxAge = elig.maxAge ?? 150;
    const mutability = ATTRIBUTE_MUTABILITY.age;

    let changeDescription: string;
    let requiredValue: string;

    if (profile.age < minAge) {
        const yearsToWait = minAge - profile.age;
        changeDescription = `You will become eligible in ${yearsToWait} year${yearsToWait > 1 ? 's' : ''} (at age ${minAge})`;
        requiredValue = `${minAge}+`;
    } else {
        changeDescription = `Age limit is ${maxAge}. You are ${profile.age - maxAge} year${(profile.age - maxAge) > 1 ? 's' : ''} over the limit`;
        requiredValue = `≤${maxAge}`;
    }

    return {
        attribute: 'age',
        displayName: ATTRIBUTE_DISPLAY_NAMES.age,
        currentValue: `${profile.age} years`,
        requiredValue,
        changeDescription,
        mutability,
        actionabilityScore: profile.age < minAge ? 0.3 : 0.0, // future eligibility has some value
        isActionable: false, // age is immutable
    };
}

function generateGenderCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    return {
        attribute: 'gender',
        displayName: ATTRIBUTE_DISPLAY_NAMES.gender,
        currentValue: profile.gender,
        requiredValue: elig.gender || 'any',
        changeDescription: `This scheme is only for ${elig.gender} applicants`,
        mutability: 'immutable',
        actionabilityScore: 0.0,
        isActionable: false,
    };
}

function generateIncomeCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const maxIncome = elig.maxAnnualIncome!;
    const excess = profile.annualIncome - maxIncome;
    const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

    return {
        attribute: 'annualIncome',
        displayName: ATTRIBUTE_DISPLAY_NAMES.annualIncome,
        currentValue: fmt(profile.annualIncome),
        requiredValue: `≤${fmt(maxIncome)}`,
        changeDescription: `If your annual income were ${fmt(excess)} lower, you would qualify`,
        mutability: ATTRIBUTE_MUTABILITY.annualIncome,
        actionabilityScore: 0.4, // income changes are meaningful but costly
        isActionable: true,
    };
}

function generateIncomeCategoryCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const allowed = elig.incomeCategoryAllowed || [];

    return {
        attribute: 'incomeCategory',
        displayName: ATTRIBUTE_DISPLAY_NAMES.incomeCategory,
        currentValue: profile.incomeCategory,
        requiredValue: allowed.join(' or '),
        changeDescription: `If your income category were ${allowed.join(' or ')}, you would qualify`,
        mutability: ATTRIBUTE_MUTABILITY.incomeCategory,
        actionabilityScore: 0.3,
        isActionable: true,
    };
}

function generateCasteCategoryCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const allowed = elig.casteCategoryAllowed || [];

    return {
        attribute: 'casteCategory',
        displayName: ATTRIBUTE_DISPLAY_NAMES.casteCategory,
        currentValue: profile.casteCategory,
        requiredValue: allowed.join(' or '),
        changeDescription: `This scheme is restricted to ${allowed.join('/')} categories`,
        mutability: 'immutable',
        actionabilityScore: 0.0,
        isActionable: false,
    };
}

function generateStateCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const states = elig.statesApplicable || [];
    const displayStates = states.length <= 3
        ? states.join(', ')
        : `${states.slice(0, 3).join(', ')} and ${states.length - 3} others`;

    return {
        attribute: 'state',
        displayName: ATTRIBUTE_DISPLAY_NAMES.state,
        currentValue: profile.state,
        requiredValue: displayStates,
        changeDescription: `This scheme is available in ${displayStates} (not ${profile.state})`,
        mutability: ATTRIBUTE_MUTABILITY.state,
        actionabilityScore: 0.1,
        isActionable: true,
    };
}

function generateEmploymentTypeCF(
    profile: UserProfile,
    elig: Scheme['eligibility']
): Counterfactual {
    const types = elig.employmentTypes || [];

    return {
        attribute: 'employmentType',
        displayName: ATTRIBUTE_DISPLAY_NAMES.employmentType,
        currentValue: profile.employmentType,
        requiredValue: types.join(' or '),
        changeDescription: `If you were registered as ${types.join(' or ')}, you would qualify`,
        mutability: ATTRIBUTE_MUTABILITY.employmentType,
        actionabilityScore: 0.5,
        isActionable: true,
    };
}

function generateSeniorCitizenCF(profile: UserProfile): Counterfactual {
    const yearsToWait = 60 - profile.age;

    return {
        attribute: 'isSeniorCitizen',
        displayName: ATTRIBUTE_DISPLAY_NAMES.isSeniorCitizen,
        currentValue: `${profile.age} years old`,
        requiredValue: '60+',
        changeDescription: yearsToWait > 0
            ? `You will qualify as a senior citizen in ${yearsToWait} year${yearsToWait > 1 ? 's' : ''}`
            : 'Requires senior citizen status',
        mutability: 'immutable',
        actionabilityScore: yearsToWait > 0 && yearsToWait <= 5 ? 0.2 : 0.0,
        isActionable: false,
    };
}

function generateRationCardCF(profile: UserProfile): Counterfactual {
    return {
        attribute: 'hasRationCard',
        displayName: ATTRIBUTE_DISPLAY_NAMES.hasRationCard,
        currentValue: profile.hasRationCard ? 'Yes' : 'No',
        requiredValue: 'Yes',
        changeDescription: 'Apply for a ration card at your local PDS office to qualify',
        mutability: 'easy',
        actionabilityScore: 0.9, // very actionable
        isActionable: true,
    };
}

function generateBooleanCF(
    attribute: string,
    displayName: string,
    currentValue: boolean,
    changeDescription: string
): Counterfactual {
    const mutability = ATTRIBUTE_MUTABILITY[attribute] || 'immutable';

    return {
        attribute,
        displayName,
        currentValue: currentValue ? 'Yes' : 'No',
        requiredValue: 'Yes',
        changeDescription,
        mutability,
        actionabilityScore: mutability === 'easy' ? 0.8 : mutability === 'costly' ? 0.4 : 0.0,
        isActionable: mutability !== 'immutable',
    };
}
