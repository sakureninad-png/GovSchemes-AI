// ==========================================
// Counterfactual Evaluation Script
// Validates CF quality metrics for the paper
// Usage: npx tsx scripts/evaluate-counterfactuals.ts
// ==========================================

import { softMatchSchemes } from '../lib/soft-matcher';
import { computeCounterfactuals } from '../lib/counterfactual';
import { SEED_SCHEMES } from '../lib/seed-schemes';
import type { UserProfile, Counterfactual } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('='.repeat(60));
console.log('  Counterfactual Evaluation Report');
console.log('='.repeat(60));
console.log();

// Test profiles
const TEST_PROFILES: UserProfile[] = [
    {
        name: 'Near-Miss Student', age: 26, gender: 'male', state: 'Delhi',
        annualIncome: 300000, incomeCategory: 'APL', employmentType: 'salaried',
        casteCategory: 'general', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: false, isFarmer: false, isMinority: false, educationLevel: 'graduate',
        hasRationCard: false, familySize: 3,
    },
    {
        name: 'BPL Female No Ration', age: 32, gender: 'female', state: 'Rajasthan',
        annualIncome: 80000, incomeCategory: 'BPL', employmentType: 'unemployed',
        casteCategory: 'SC', isDisabled: false, isWidow: true, isSeniorCitizen: false,
        isStudent: false, isFarmer: false, isMinority: false, educationLevel: 'primary',
        hasRationCard: false, familySize: 5,
    },
    {
        name: 'Middle Income OBC', age: 45, gender: 'male', state: 'Gujarat',
        annualIncome: 500000, incomeCategory: 'general', employmentType: 'self-employed',
        casteCategory: 'OBC', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: false, isFarmer: false, isMinority: true, educationLevel: 'secondary',
        hasRationCard: false, familySize: 4,
    },
];

interface CFStats {
    profileName: string;
    totalSchemesAnalyzed: number;
    schemesWithCFs: number;
    totalCFs: number;
    actionableCFs: number;
    easyCFs: number;
    costlyCFs: number;
    immutableCFs: number;
    avgActionability: number;
    validCFRate: number;  // CFs that actually fix eligibility when applied
}

const allStats: CFStats[] = [];
let totalValidated = 0;
let totalValid = 0;

for (const profile of TEST_PROFILES) {
    profile.isSeniorCitizen = profile.age >= 60;

    const softResults = softMatchSchemes(profile, SEED_SCHEMES);
    const nearMisses = softResults.filter(r => !r.isEligible);

    let totalCFs = 0;
    let actionableCFs = 0;
    let easyCFs = 0;
    let costlyCFs = 0;
    let immutableCFs = 0;
    let actionabilitySum = 0;
    let schemesWithCFs = 0;
    let validCount = 0;
    let validatedCount = 0;

    for (const result of nearMisses) {
        const cfResult = computeCounterfactuals(profile, result.scheme, result.constraintScores);

        if (cfResult.counterfactuals.length > 0) {
            schemesWithCFs++;
        }

        for (const cf of cfResult.counterfactuals) {
            totalCFs++;
            actionabilitySum += cf.actionabilityScore;

            if (cf.isActionable) actionableCFs++;
            if (cf.mutability === 'easy') easyCFs++;
            if (cf.mutability === 'costly') costlyCFs++;
            if (cf.mutability === 'immutable') immutableCFs++;

            // Validate: if we apply this CF, does eligibility actually improve?
            if (cf.isActionable) {
                validatedCount++;
                const modified = applyCounterfactual(profile, cf);
                if (modified) {
                    const newResults = softMatchSchemes(modified, [result.scheme]);
                    if (newResults.length > 0 && newResults[0].compositeScore > result.compositeScore) {
                        validCount++;
                    }
                }
            }
        }
    }

    totalValidated += validatedCount;
    totalValid += validCount;

    allStats.push({
        profileName: profile.name,
        totalSchemesAnalyzed: nearMisses.length,
        schemesWithCFs,
        totalCFs,
        actionableCFs,
        easyCFs,
        costlyCFs,
        immutableCFs,
        avgActionability: totalCFs > 0 ? actionabilitySum / totalCFs : 0,
        validCFRate: validatedCount > 0 ? validCount / validatedCount : 0,
    });
}

// Print results
console.log('─'.repeat(100));
console.log(
    padR('Profile', 22) +
    padR('Schemes', 9) +
    padR('W/CFs', 7) +
    padR('Total', 7) +
    padR('Action', 8) +
    padR('Easy', 6) +
    padR('Costly', 8) +
    padR('Immut', 7) +
    padR('Avg Act', 9) +
    padR('Valid%', 8)
);
console.log('─'.repeat(100));

for (const s of allStats) {
    console.log(
        padR(s.profileName, 22) +
        padR(String(s.totalSchemesAnalyzed), 9) +
        padR(String(s.schemesWithCFs), 7) +
        padR(String(s.totalCFs), 7) +
        padR(String(s.actionableCFs), 8) +
        padR(String(s.easyCFs), 6) +
        padR(String(s.costlyCFs), 8) +
        padR(String(s.immutableCFs), 7) +
        padR(s.avgActionability.toFixed(2), 9) +
        padR(`${(s.validCFRate * 100).toFixed(0)}%`, 8)
    );
}
console.log('─'.repeat(100));

// Summary
console.log();
const totals = allStats.reduce((acc, s) => ({
    schemes: acc.schemes + s.totalSchemesAnalyzed,
    withCFs: acc.withCFs + s.schemesWithCFs,
    total: acc.total + s.totalCFs,
    actionable: acc.actionable + s.actionableCFs,
    easy: acc.easy + s.easyCFs,
    costly: acc.costly + s.costlyCFs,
    immutable: acc.immutable + s.immutableCFs,
}), { schemes: 0, withCFs: 0, total: 0, actionable: 0, easy: 0, costly: 0, immutable: 0 });

console.log('  SUMMARY:');
console.log(`  Near-miss schemes analyzed:   ${totals.schemes}`);
console.log(`  Schemes with CFs:             ${totals.withCFs} (${totals.schemes > 0 ? ((totals.withCFs / totals.schemes) * 100).toFixed(0) : 0}% coverage)`);
console.log(`  Total counterfactuals:         ${totals.total}`);
console.log(`  Actionable:                    ${totals.actionable} (${totals.total > 0 ? ((totals.actionable / totals.total) * 100).toFixed(0) : 0}%)`);
console.log(`  Distribution: Easy=${totals.easy}, Costly=${totals.costly}, Immutable=${totals.immutable}`);
console.log(`  CF Validity Rate:              ${totalValidated > 0 ? ((totalValid / totalValidated) * 100).toFixed(1) : 'N/A'}%`);
console.log();

// Save
const outputDir = path.resolve(__dirname, '..', 'results');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'counterfactual-evaluation.json');
fs.writeFileSync(outputPath, JSON.stringify({ profileStats: allStats, totals, validityRate: totalValidated > 0 ? totalValid / totalValidated : 0 }, null, 2));
console.log(`  Results saved to: ${outputPath}`);

// ==========================================
// Helpers
// ==========================================

function padR(s: string, n: number): string { return s.padEnd(n); }

/**
 * Apply a counterfactual change to a profile to validate it.
 * Returns a modified copy, or null if the change can't be simulated.
 */
function applyCounterfactual(profile: UserProfile, cf: Counterfactual): UserProfile | null {
    const modified = { ...profile };

    switch (cf.attribute) {
        case 'hasRationCard':
            modified.hasRationCard = true;
            return modified;
        case 'isStudent':
            modified.isStudent = true;
            return modified;
        case 'isFarmer':
            modified.isFarmer = true;
            modified.employmentType = 'farmer';
            return modified;
        case 'employmentType':
            modified.employmentType = cf.requiredValue.split(' or ')[0] as UserProfile['employmentType'];
            return modified;
        case 'annualIncome': {
            // Parse the required max income from the requiredValue
            const match = cf.requiredValue.match(/[\d,]+/);
            if (match) {
                modified.annualIncome = parseInt(match[0].replace(/,/g, ''), 10);
                return modified;
            }
            return null;
        }
        case 'incomeCategory':
            modified.incomeCategory = cf.requiredValue.split(' or ')[0] as UserProfile['incomeCategory'];
            return modified;
        default:
            return null; // Can't simulate immutable changes
    }
}
