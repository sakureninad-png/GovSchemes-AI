// ==========================================
// Matcher Evaluation Script
// Compares binary matcher vs soft matcher
// Usage: npx tsx scripts/evaluate-matcher.ts
// ==========================================

import { matchSchemes } from '../lib/matcher';
import { softMatchSchemes } from '../lib/soft-matcher';
import { SEED_SCHEMES } from '../lib/seed-schemes';
import type { UserProfile } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('='.repeat(60));
console.log('  Matcher Evaluation: Binary vs Soft Constraint');
console.log('='.repeat(60));
console.log();

// Test profiles spanning diverse demographics
const TEST_PROFILES: UserProfile[] = [
    {
        name: 'Young Male BPL', age: 22, gender: 'male', state: 'Bihar',
        annualIncome: 60000, incomeCategory: 'BPL', employmentType: 'unemployed',
        casteCategory: 'SC', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: true, isFarmer: false, isMinority: false, educationLevel: 'secondary',
        hasRationCard: true, familySize: 5,
    },
    {
        name: 'Female Farmer', age: 35, gender: 'female', state: 'Odisha',
        annualIncome: 120000, incomeCategory: 'BPL', employmentType: 'farmer',
        casteCategory: 'ST', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: false, isFarmer: true, isMinority: false, educationLevel: 'primary',
        hasRationCard: true, familySize: 4,
    },
    {
        name: 'Senior Citizen', age: 65, gender: 'male', state: 'Kerala',
        annualIncome: 50000, incomeCategory: 'BPL', employmentType: 'unemployed',
        casteCategory: 'general', isDisabled: true, isWidow: false, isSeniorCitizen: true,
        isStudent: false, isFarmer: false, isMinority: false, educationLevel: 'secondary',
        hasRationCard: true, familySize: 2,
    },
    {
        name: 'Middle Income Graduate', age: 28, gender: 'female', state: 'Maharashtra',
        annualIncome: 450000, incomeCategory: 'general', employmentType: 'salaried',
        casteCategory: 'OBC', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: false, isFarmer: false, isMinority: true, educationLevel: 'graduate',
        hasRationCard: false, familySize: 3,
    },
    {
        name: 'Near-Miss Edge Case', age: 41, gender: 'male', state: 'Uttar Pradesh',
        annualIncome: 260000, incomeCategory: 'APL', employmentType: 'self-employed',
        casteCategory: 'general', isDisabled: false, isWidow: false, isSeniorCitizen: false,
        isStudent: false, isFarmer: false, isMinority: false, educationLevel: 'graduate',
        hasRationCard: false, familySize: 4,
    },
];

interface EvalResult {
    profileName: string;
    binaryMatches: number;
    binaryNearMisses: number;
    softMatches: number;
    softNearMisses: number;
    softExtraCaptures: number;    // schemes found by soft but not binary
    avgBinaryScore: number;
    avgSoftScore: number;
    scoreDelta: number;
}

const results: EvalResult[] = [];

console.log('Running evaluation...');
console.log();

for (const profile of TEST_PROFILES) {
    profile.isSeniorCitizen = profile.age >= 60;

    // Binary matcher
    const binaryResults = matchSchemes(profile, SEED_SCHEMES);
    const binaryEligible = binaryResults.filter(r => !r.isNearMiss);
    const binaryNearMiss = binaryResults.filter(r => r.isNearMiss);

    // Soft matcher
    const softResults = softMatchSchemes(profile, SEED_SCHEMES);
    const softEligible = softResults.filter(r => r.isEligible);
    const softNearMiss = softResults.filter(r => r.isNearMiss);

    // Schemes found by soft but not binary
    const binarySchemeIds = new Set(binaryResults.map(r => r.scheme.id));
    const extraCaptures = softResults.filter(r => !binarySchemeIds.has(r.scheme.id));

    const avgBinary = binaryResults.length > 0
        ? binaryResults.reduce((s, r) => s + r.matchScore, 0) / binaryResults.length
        : 0;
    const avgSoft = softResults.length > 0
        ? softResults.reduce((s, r) => s + r.compositeScore, 0) / softResults.length
        : 0;

    results.push({
        profileName: profile.name,
        binaryMatches: binaryEligible.length,
        binaryNearMisses: binaryNearMiss.length,
        softMatches: softEligible.length,
        softNearMisses: softNearMiss.length,
        softExtraCaptures: extraCaptures.length,
        avgBinaryScore: avgBinary,
        avgSoftScore: avgSoft,
        scoreDelta: avgSoft - avgBinary,
    });
}

// Print results
console.log('─'.repeat(110));
console.log(
    padR('Profile', 25) +
    padR('Bin Match', 10) +
    padR('Bin Near', 10) +
    padR('Soft Match', 11) +
    padR('Soft Near', 10) +
    padR('Extra', 7) +
    padR('Avg Bin', 9) +
    padR('Avg Soft', 10) +
    padR('Delta', 8)
);
console.log('─'.repeat(110));

for (const r of results) {
    console.log(
        padR(r.profileName, 25) +
        padR(String(r.binaryMatches), 10) +
        padR(String(r.binaryNearMisses), 10) +
        padR(String(r.softMatches), 11) +
        padR(String(r.softNearMisses), 10) +
        padR(String(r.softExtraCaptures), 7) +
        padR(r.avgBinaryScore.toFixed(1), 9) +
        padR(r.avgSoftScore.toFixed(1), 10) +
        padR((r.scoreDelta >= 0 ? '+' : '') + r.scoreDelta.toFixed(1), 8)
    );
}
console.log('─'.repeat(110));

// Summary
console.log();
const totalBinaryMatches = results.reduce((s, r) => s + r.binaryMatches, 0);
const totalSoftMatches = results.reduce((s, r) => s + r.softMatches, 0);
const totalExtraCaptures = results.reduce((s, r) => s + r.softExtraCaptures, 0);
const avgDelta = results.reduce((s, r) => s + r.scoreDelta, 0) / results.length;

console.log('  SUMMARY:');
console.log(`  Total binary matches:      ${totalBinaryMatches}`);
console.log(`  Total soft matches:        ${totalSoftMatches}`);
console.log(`  Extra captures (soft):     ${totalExtraCaptures}`);
console.log(`  Avg score delta:           ${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(2)}`);
console.log();

// Save results
const outputDir = path.resolve(__dirname, '..', 'results');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'matcher-evaluation.json');
fs.writeFileSync(outputPath, JSON.stringify({ profiles: results, summary: { totalBinaryMatches, totalSoftMatches, totalExtraCaptures, avgDelta } }, null, 2));
console.log(`  Results saved to: ${outputPath}`);

function padR(s: string, n: number): string { return s.padEnd(n); }
