// ==========================================
// GovSchemes AI — Core TypeScript Types
// ==========================================

export interface UserProfile {
    id?: string;

    // Demographics
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    state: string;
    district?: string;

    // Socioeconomic
    annualIncome: number;
    incomeCategory: 'BPL' | 'APL' | 'EWS' | 'general';
    employmentType: 'unemployed' | 'self-employed' | 'salaried' | 'farmer' | 'student';

    // Category
    casteCategory: 'general' | 'OBC' | 'SC' | 'ST';
    religion?: string;

    // Special flags
    isDisabled: boolean;
    disabilityPercentage?: number;
    isWidow: boolean;
    isSeniorCitizen: boolean;
    isStudent: boolean;
    isFarmer: boolean;
    isMinority: boolean;

    // Education
    educationLevel: 'none' | 'primary' | 'secondary' | 'graduate' | 'postgraduate';

    // Family
    familySize?: number;
    hasRationCard: boolean;
    rationCardType?: 'yellow' | 'saffron' | 'white' | 'pink' | 'AAY';

    createdAt?: string;
    updatedAt?: string;
}

export interface Scheme {
    id: string;
    name: string;
    ministry: string;
    department?: string;
    description: string;
    benefitType: 'scholarship' | 'subsidy' | 'loan' | 'insurance' | 'pension' | 'employment' | 'housing' | 'healthcare' | 'other';
    benefitAmount?: number;
    benefitDescription: string;

    eligibility: {
        minAge?: number;
        maxAge?: number;
        gender?: 'male' | 'female' | 'any';
        maxAnnualIncome?: number;
        incomeCategoryAllowed?: string[];
        casteCategoryAllowed?: string[];
        statesApplicable?: string[];
        employmentTypes?: string[];
        educationRequired?: string;
        mustBeDisabled?: boolean;
        mustBeWidow?: boolean;
        mustBeStudent?: boolean;
        mustBeFarmer?: boolean;
        mustBeSeniorCitizen?: boolean;
        mustHaveRationCard?: boolean;
        isMinority?: boolean;
    };

    applicationLink?: string;
    documentsRequired: string[];
    schemeLevel: 'central' | 'state';
    state?: string;
    isActive: boolean;
    mySchemeId?: string;
    createdAt?: string;
}

export interface Recommendation {
    id: string;
    userId: string;
    schemeId: string;
    scheme: Scheme;
    matchScore: number;
    matchedCriteria: string[];
    missedCriteria: string[];
    aiExplanation: string;
    createdAt: string;
}

// ==========================================
// Feature 1: Soft Constraint Types
// ==========================================

export type ConstraintType = 'hard' | 'soft';
export type DecayFunction = 'linear' | 'exponential' | 'sigmoid' | 'step';

export interface ConstraintScore {
    criterionName: string;
    constraintType: ConstraintType;
    passed: boolean;
    softScore: number;          // 0.0–1.0 continuous score
    distance?: number;          // how far from threshold
    threshold?: string;         // threshold value (for display)
    userValue?: string;         // user's actual value (for display)
    displayMessage: string;     // human-readable criterion description
}

export interface SoftMatchResult {
    scheme: Scheme;
    hardScore: number;          // 0 or 1 (all hard constraints pass?)
    softScore: number;          // 0.0–1.0 weighted average of soft scores
    compositeScore: number;     // final blended score 0–100
    constraintScores: ConstraintScore[];
    matchedCriteria: string[];
    missedCriteria: string[];
    isNearMiss: boolean;
    isEligible: boolean;        // all hard constraints pass
}

// ==========================================
// Feature 2: Counterfactual Types
// ==========================================

export type AttributeMutability = 'immutable' | 'costly' | 'easy';

export interface Counterfactual {
    attribute: string;
    displayName: string;
    currentValue: string;
    requiredValue: string;
    changeDescription: string;
    mutability: AttributeMutability;
    actionabilityScore: number; // 0.0–1.0 (higher = more actionable)
    isActionable: boolean;      // mutability !== 'immutable'
}

export interface CounterfactualResult {
    schemeId: string;
    schemeName: string;
    counterfactuals: Counterfactual[];
    totalActionable: number;
    bestAction: string;         // natural language summary of best action
}

// ==========================================
// Feature 4: Fairness Types
// ==========================================

export interface DemographicGroup {
    gender?: string;
    casteCategory?: string;
    incomeCategory?: string;
    state?: string;
    label: string;
}

export interface GroupMetrics {
    group: DemographicGroup;
    avgSchemesRecommended: number;
    avgCompositeScore: number;
    avgBenefitAmount: number;
    coverageRate: number;       // % of schemes this group can access
    profileCount: number;
}

export interface FairnessReport {
    timestamp: string;
    totalProfiles: number;
    totalSchemes: number;
    groupMetrics: GroupMetrics[];
    demographicParityRatio: number;
    giniCoefficient: number;
    coverageDisparity: number;
    recommendations: string[];
}

export interface EnhancedRecommendation extends Recommendation {
    compositeScore: number;
    constraintScores?: ConstraintScore[];
    counterfactuals?: Counterfactual[];
    fairnessAdjusted?: boolean;
}

// ==========================================
// Form-specific types
// ==========================================

// Form-specific types
export type OnboardingFormData = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'isSeniorCitizen'>;

export interface StepValidation {
    isValid: boolean;
    errors: Record<string, string>;
}
