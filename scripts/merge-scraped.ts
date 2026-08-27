/**
 * Merge Scraped JSON into Seed Data
 * 
 * Reads data/scraped-schemes.json and appends new schemes to lib/seed-schemes.ts
 * 
 * Usage:
 *   npx tsx scripts/merge-scraped.ts
 *   npx tsx scripts/merge-scraped.ts data/custom-scraped.json
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_JSON = path.resolve(__dirname, '..', 'data', 'scraped-schemes.json');
const SEED_FILE = path.resolve(__dirname, '..', 'lib', 'seed-schemes.ts');

interface ScrapedScheme {
    id: string;
    name: string;
    ministry: string;
    department?: string;
    description: string;
    benefitType: string;
    benefitAmount?: number;
    benefitDescription: string;
    eligibility: {
        minAge?: number;
        maxAge?: number;
        gender?: string;
        maxAnnualIncome?: number;
        incomeCategoryAllowed?: string[];
        casteCategoryAllowed?: string[];
        employmentTypes?: string[];
        mustBeDisabled?: boolean;
        mustBeWidow?: boolean;
        mustBeStudent?: boolean;
        mustBeFarmer?: boolean;
        mustBeSeniorCitizen?: boolean;
        mustHaveRationCard?: boolean;
        isMinority?: boolean;
    };
    documentsRequired: string[];
    schemeLevel: string;
    applicationLink?: string;
}

function escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');
}

function schemeToTypeScript(s: ScrapedScheme): string {
    const lines: string[] = [];
    lines.push(`    {`);
    lines.push(`        id: '${escape(s.id)}',`);
    lines.push(`        name: '${escape(s.name)}',`);
    lines.push(`        ministry: '${escape(s.ministry)}',`);
    if (s.department) lines.push(`        department: '${escape(s.department)}',`);
    lines.push(`        description: '${escape(s.description)}',`);
    lines.push(`        benefitType: '${escape(s.benefitType)}',`);
    if (s.benefitAmount) lines.push(`        benefitAmount: ${s.benefitAmount},`);
    lines.push(`        benefitDescription: '${escape(s.benefitDescription)}',`);

    lines.push(`        eligibility: {`);
    const e = s.eligibility;
    if (e.minAge !== undefined) lines.push(`            minAge: ${e.minAge},`);
    if (e.maxAge !== undefined) lines.push(`            maxAge: ${e.maxAge},`);
    if (e.gender && e.gender !== 'any') lines.push(`            gender: '${e.gender}',`);
    if (e.maxAnnualIncome !== undefined) lines.push(`            maxAnnualIncome: ${e.maxAnnualIncome},`);
    if (e.incomeCategoryAllowed?.length) lines.push(`            incomeCategoryAllowed: [${e.incomeCategoryAllowed.map(v => `'${v}'`).join(', ')}],`);
    if (e.casteCategoryAllowed?.length) lines.push(`            casteCategoryAllowed: [${e.casteCategoryAllowed.map(v => `'${v}'`).join(', ')}],`);
    if (e.employmentTypes?.length) lines.push(`            employmentTypes: [${e.employmentTypes.map(v => `'${v}'`).join(', ')}],`);
    if (e.mustBeDisabled) lines.push(`            mustBeDisabled: true,`);
    if (e.mustBeWidow) lines.push(`            mustBeWidow: true,`);
    if (e.mustBeStudent) lines.push(`            mustBeStudent: true,`);
    if (e.mustBeFarmer) lines.push(`            mustBeFarmer: true,`);
    if (e.mustBeSeniorCitizen) lines.push(`            mustBeSeniorCitizen: true,`);
    if (e.mustHaveRationCard) lines.push(`            mustHaveRationCard: true,`);
    if (e.isMinority) lines.push(`            isMinority: true,`);
    lines.push(`        },`);

    const docs = s.documentsRequired.map(d => `'${escape(d)}'`).join(', ');
    lines.push(`        documentsRequired: [${docs}],`);
    lines.push(`        schemeLevel: '${s.schemeLevel || 'central'}',`);
    lines.push(`        isActive: true,`);
    if (s.applicationLink) lines.push(`        applicationLink: '${escape(s.applicationLink)}',`);
    lines.push(`    },`);

    return lines.join('\n');
}

function main() {
    const jsonPath = process.argv[2] || DEFAULT_JSON;

    if (!fs.existsSync(jsonPath)) {
        console.error(`JSON file not found: ${jsonPath}`);
        console.error('Run the scraper first: npx tsx scripts/scrape-myscheme.ts');
        process.exit(1);
    }

    console.log(`[Merge] Reading: ${jsonPath}`);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const schemes: ScrapedScheme[] = data.schemes || [];

    console.log(`[Merge] Found ${schemes.length} scraped schemes`);

    if (schemes.length === 0) {
        console.log('[Merge] No schemes to merge.');
        return;
    }

    // Get existing IDs and names for dedup
    let existingIds = new Set<string>();
    let existingNames = new Set<string>();
    if (fs.existsSync(SEED_FILE)) {
        const content = fs.readFileSync(SEED_FILE, 'utf-8');
        for (const m of content.matchAll(/id:\s*'([^']+)'/g)) existingIds.add(m[1]);
        for (const m of content.matchAll(/name:\s*'([^']+)'/g)) existingNames.add(m[1].toLowerCase());
        console.log(`[Merge] Existing seed: ${existingIds.size} schemes`);
    }

    // Filter duplicates (by ID and by name similarity)
    const newSchemes = schemes.filter(s => {
        if (existingIds.has(s.id)) {
            console.log(`[Merge]   ⚠ Skip (dup id): ${s.name}`);
            return false;
        }
        if (existingNames.has(s.name.toLowerCase())) {
            console.log(`[Merge]   ⚠ Skip (dup name): ${s.name}`);
            return false;
        }
        return true;
    });

    if (newSchemes.length === 0) {
        console.log('[Merge] All scraped schemes already exist. Nothing to add.');
        return;
    }

    console.log(`[Merge] Adding ${newSchemes.length} new schemes...`);

    const blocks = newSchemes.map(s => schemeToTypeScript(s));

    // Insert before closing ];
    let seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
    const idx = seedContent.lastIndexOf('];');
    if (idx === -1) {
        console.error('[Merge] Could not find closing bracket in seed file.');
        process.exit(1);
    }

    seedContent = seedContent.slice(0, idx) + blocks.join('\n') + '\n' + seedContent.slice(idx);
    fs.writeFileSync(SEED_FILE, seedContent, 'utf-8');

    console.log(`[Merge] ✓ Added ${newSchemes.length} schemes to ${SEED_FILE}`);
    console.log(`[Merge] Total seed schemes: ${existingIds.size + newSchemes.length}`);
    console.log('[Merge] Done!');
}

main();
