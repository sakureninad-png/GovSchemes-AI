// ==========================================
// Fairness Audit CLI Script
// Usage: npx tsx scripts/run-fairness-audit.ts
// ==========================================

import { generateDemographicGrid, generateFairnessReport, computeGroupMetrics } from '../lib/fairness';
import { softMatchSchemes } from '../lib/soft-matcher';
import { SEED_SCHEMES } from '../lib/seed-schemes';
import { mmrRerank } from '../lib/fair-reranker';
import type { UserProfile, EnhancedRecommendation } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('='.repeat(60));
console.log('  FairScheme — Fairness Audit Report');
console.log('='.repeat(60));
console.log();

// Step 1: Generate synthetic profiles
console.log('[1/4] Generating synthetic demographic profiles...');
const profiles = generateDemographicGrid();
console.log(`  → ${profiles.length} synthetic profiles generated`);
console.log(`  → Grid: ${3} genders × ${4} castes × ${4} income levels × ${5} states`);
console.log();

// Step 2: Run matcher on all profiles (BEFORE fairness re-ranking)
console.log('[2/4] Running soft matcher on all profiles (baseline)...');
const startTime = Date.now();

interface AuditResult {
    profile: UserProfile;
    eligible: number;
    nearMiss: number;
    avgScore: number;
    totalBenefit: number;
}

const baselineResults: AuditResult[] = [];

for (const profile of profiles) {
    profile.isSeniorCitizen = profile.age >= 60;
    const results = softMatchSchemes(profile, SEED_SCHEMES);
    const eligible = results.filter(r => r.isEligible);

    baselineResults.push({
        profile,
        eligible: eligible.length,
        nearMiss: results.filter(r => r.isNearMiss).length,
        avgScore: eligible.length > 0
            ? eligible.reduce((s, r) => s + r.compositeScore, 0) / eligible.length
            : 0,
        totalBenefit: eligible.reduce((s, r) => s + (r.scheme.benefitAmount || 0), 0),
    });
}

const matchTime = Date.now() - startTime;
console.log(`  → Completed in ${matchTime}ms`);
console.log();

// Step 3: Generate fairness report
console.log('[3/4] Computing fairness metrics...');
const report = generateFairnessReport(profiles, SEED_SCHEMES);

// Print results table
console.log();
console.log('─'.repeat(90));
console.log('  GROUP METRICS');
console.log('─'.repeat(90));
console.log(
    padRight('Group', 30) +
    padRight('Avg Schemes', 14) +
    padRight('Avg Score', 12) +
    padRight('Avg Benefit', 14) +
    padRight('Coverage', 10) +
    padRight('Profiles', 10)
);
console.log('─'.repeat(90));

for (const gm of report.groupMetrics) {
    console.log(
        padRight(gm.group.label, 30) +
        padRight(gm.avgSchemesRecommended.toFixed(1), 14) +
        padRight(gm.avgCompositeScore.toFixed(1), 12) +
        padRight(`₹${Math.round(gm.avgBenefitAmount).toLocaleString('en-IN')}`, 14) +
        padRight(`${gm.coverageRate.toFixed(1)}%`, 10) +
        padRight(String(gm.profileCount), 10)
    );
}
console.log('─'.repeat(90));
console.log();

// Summary metrics
console.log('─'.repeat(60));
console.log('  SUMMARY METRICS');
console.log('─'.repeat(60));
console.log(`  Demographic Parity Ratio:  ${report.demographicParityRatio.toFixed(4)}`);
console.log(`  Gini Coefficient:          ${report.giniCoefficient.toFixed(4)}`);
console.log(`  Coverage Disparity:        ${(report.coverageDisparity * 100).toFixed(2)}%`);
console.log(`  Total Profiles Tested:     ${report.totalProfiles}`);
console.log(`  Total Active Schemes:      ${report.totalSchemes}`);
console.log('─'.repeat(60));
console.log();

// Recommendations
if (report.recommendations.length > 0) {
    console.log('  ⚠ DISPARITY FINDINGS:');
    for (const rec of report.recommendations) {
        console.log(`    • ${rec}`);
    }
    console.log();
}

// Step 4: Save report
console.log('[4/4] Saving report...');
const outputDir = path.resolve(__dirname, '..', 'results');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'fairness-report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`  → Report saved to: ${outputPath}`);

// Also save a CSV summary
const csvPath = path.join(outputDir, 'fairness-summary.csv');
const csvHeader = 'Group,Avg Schemes,Avg Score,Avg Benefit,Coverage %,Profiles\n';
const csvRows = report.groupMetrics.map(gm =>
    `"${gm.group.label}",${gm.avgSchemesRecommended.toFixed(1)},${gm.avgCompositeScore.toFixed(1)},${Math.round(gm.avgBenefitAmount)},${gm.coverageRate.toFixed(1)},${gm.profileCount}`
).join('\n');
fs.writeFileSync(csvPath, csvHeader + csvRows);
console.log(`  → CSV summary saved to: ${csvPath}`);

console.log();
console.log('='.repeat(60));
console.log('  Audit complete. Use results for paper evaluation.');
console.log('='.repeat(60));

// Helper
function padRight(str: string, len: number): string {
    return str.padEnd(len);
}
