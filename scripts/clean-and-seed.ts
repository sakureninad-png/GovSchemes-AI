/**
 * Clean CSV and generate seed-schemes.ts
 * 
 * - Fixes double-double-quote formatting (""text"" → text)
 * - Removes duplicate schemes (by normalized name)
 * - Generates a complete lib/seed-schemes.ts
 * 
 * Usage: npx tsx scripts/clean-and-seed.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.resolve(__dirname, '..', 'indian_schemes_full_2026-03-26.csv');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'lib', 'seed-schemes.ts');

// Known duplicates to skip (keep the first occurrence, skip these IDs)
const SKIP_IDS = new Set([
    // Duplicates of majhi-ladki-bahin (line 82)
    'manjhi-ladki-behan-maha',
    'mukhyamantri-majhi-ladki-bahin',

    // Duplicate of biju-swasthya-kalyan (line 81) 
    'swasthya-bhima-odisha',
    'swasthya-sathi-card-wb', // duplicate of swasthya-sathi-scheme

    // "Revised" entries that overlap with existing entries
    'kanya-sumangala-plus',
    'up-vivah-hetu-anudan-plus',
    'ladli-social-security-plus',
    'pension-vridha-odisha-revised',
    'pension-divyang-odisha-revised',

    // Duplicate of ladli-social-security
    'ladli-social-security-haryana',

    // Duplicate of bhagyalaxmi-yojana
    'bhagyalaxmi-bond-karnataka',

    // Duplicate pension entries
    'mukhya-mantri-vridhjan-bihar', // duplicate of pension-old-age-bihar

    // Duplicate of swavalamban-card-pension (line 150)
    'swavalamban-card-pension-up', // is actually Divyang Shadi Protsahan - keep with corrected ID

    // Almost duplicate of the same UP Shadi Anudan
    'up-vivah-hetu-anudan',  // keep up-mukhyamantri-kanya-vivah or the other entry ? Let's keep up-vivah-hetu-anudan and skip the other
    'up-mukhyamantri-kanya-vivah', // duplicate of up-vivah-hetu-anudan

    // Mid day meal is duplicate of pm-poshan
    'mid-day-meal-program',

    // Duplicate Shakti Scheme entries
    'shakti-free-travel-kar', // dup of shakti-scheme-free-bus

    // Duplicate Mukhyamantri Kisan Sahay
    'mukhyamantri-kisan-sahay-gu', // dup of mukhya-mantri-kisan-sahay (line 117, Gujarat)

    // Duplicate Yashaswini
    'yashaswini-kar', // dup of yashaswini-scheme

    // Duplicate Maitri
    'mukhya-mantri-maitri-sikkim', // dup of mukhya-mantri-maitri-yojana

    // Duplicate UP Yuva Swarozgar
    'up-mukhyamantri-yuva-swarozgar', // dup of kisan-udyami-loan-up

    // Duplicate Shravan Bal pension
    'shravan-bal-pension-maha', // dup of shravan-bal-yojana

    // Duplicate Mai Bhago
    'punjab-mai-bhago-shakti', // dup of mai-bhago-scheme

    // Duplicate UP Viklang Shadi
    'up-viklang-shadi-hetu', // dup of swavalamban-card-pension-up / divyang-shadi (line 167)

    // ODOP duplicates
    'up-one-district-one-product', // dup of odop-financial-assistance

    // PM SVANidhi duplicate
    'pm-svanidhi-loan', // dup of pm-svanidhi
]);

function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Skip escaped double-double-quotes entirely
                i++;
                continue;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current.trim());
    return fields;
}

function esc(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');
}

function main() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV not found:', CSV_PATH);
        process.exit(1);
    }

    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);

    // Header
    const header = parseCsvLine(lines[0]);
    console.log('[Clean] CSV columns:', header.length);
    console.log('[Clean] Data rows:', lines.length - 1);

    // Parse rows
    interface Row { [key: string]: string }
    const rows: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine(lines[i]);
        if (vals.length < header.length) {
            console.log(`  ⚠ Row ${i} has ${vals.length} cols, expected ${header.length} — skipping`);
            continue;
        }
        const row: Row = {};
        for (let j = 0; j < header.length; j++) {
            row[header[j]] = vals[j] || '';
        }
        rows.push(row);
    }

    console.log('[Clean] Parsed', rows.length, 'rows');

    // Remove known duplicates
    const filtered = rows.filter(r => {
        if (SKIP_IDS.has(r.id)) {
            console.log(`  ✕ Removing duplicate: ${r.id} (${r.name})`);
            return false;
        }
        return true;
    });

    // Additional dedup: by normalized name
    const seenNames = new Map<string, string>();
    const deduped = filtered.filter(r => {
        const norm = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNames.has(norm)) {
            console.log(`  ✕ Name-dup: "${r.name}" duplicates "${seenNames.get(norm)}"`);
            return false;
        }
        seenNames.set(norm, r.name);
        return true;
    });

    console.log(`[Clean] After dedup: ${deduped.length} schemes (removed ${rows.length - deduped.length})`);

    // Generate TypeScript
    const tsBlocks: string[] = [];

    for (const r of deduped) {
        const lines: string[] = [];
        lines.push('    {');
        lines.push(`        id: '${esc(r.id)}',`);
        lines.push(`        name: '${esc(r.name)}',`);
        lines.push(`        ministry: '${esc(r.ministry)}',`);
        if (r.department) lines.push(`        department: '${esc(r.department)}',`);
        lines.push(`        description: '${esc(r.description)}',`);

        // benefitType
        const validBenefitTypes = ['scholarship', 'subsidy', 'loan', 'insurance', 'pension', 'employment', 'housing', 'healthcare', 'other'];
        const bt = validBenefitTypes.includes(r.benefitType) ? r.benefitType : 'other';
        lines.push(`        benefitType: '${bt}',`);

        // benefitAmount
        if (r.benefitAmount && !isNaN(parseInt(r.benefitAmount))) {
            lines.push(`        benefitAmount: ${parseInt(r.benefitAmount)},`);
        }

        lines.push(`        benefitDescription: '${esc(r.benefitDescription || r.description)}',`);

        // Eligibility block
        lines.push('        eligibility: {');
        if (r.minAge && !isNaN(parseInt(r.minAge))) lines.push(`            minAge: ${parseInt(r.minAge)},`);
        if (r.maxAge && !isNaN(parseInt(r.maxAge))) lines.push(`            maxAge: ${parseInt(r.maxAge)},`);

        const gender = r.gender || 'any';
        if (['male', 'female', 'any'].includes(gender)) {
            lines.push(`            gender: '${gender}',`);
        } else {
            lines.push(`            gender: 'any',`);
        }

        if (r.maxAnnualIncome && !isNaN(parseInt(r.maxAnnualIncome))) {
            lines.push(`            maxAnnualIncome: ${parseInt(r.maxAnnualIncome)},`);
        }

        if (r.incomeCategoryAllowed) {
            const cats = r.incomeCategoryAllowed.split('|').filter(Boolean);
            if (cats.length) lines.push(`            incomeCategoryAllowed: [${cats.map(c => `'${c.trim()}'`).join(', ')}],`);
        }

        if (r.casteCategoryAllowed) {
            const cats = r.casteCategoryAllowed.split('|').filter(Boolean);
            if (cats.length) lines.push(`            casteCategoryAllowed: [${cats.map(c => `'${c.trim()}'`).join(', ')}],`);
        }

        if (r.employmentTypes) {
            const types = r.employmentTypes.split('|').filter(Boolean);
            if (types.length) lines.push(`            employmentTypes: [${types.map(t => `'${t.trim()}'`).join(', ')}],`);
        }

        // Boolean flags
        if (r.mustBeDisabled === 'true') lines.push('            mustBeDisabled: true,');
        if (r.mustBeWidow === 'true') lines.push('            mustBeWidow: true,');
        if (r.mustBeStudent === 'true') lines.push('            mustBeStudent: true,');
        if (r.mustBeFarmer === 'true') lines.push('            mustBeFarmer: true,');
        if (r.mustBeSeniorCitizen === 'true') lines.push('            mustBeSeniorCitizen: true,');
        if (r.mustHaveRationCard === 'true') lines.push('            mustHaveRationCard: true,');
        if (r.isMinority === 'true') lines.push('            isMinority: true,');

        lines.push('        },');

        // Documents
        const docs = r.documentsRequired ? r.documentsRequired.split('|').filter(Boolean) : ['Aadhaar Card'];
        lines.push(`        documentsRequired: [${docs.map(d => `'${esc(d.trim())}'`).join(', ')}],`);

        // schemeLevel
        const level = r.schemeLevel === 'state' ? 'state' : 'central';
        lines.push(`        schemeLevel: '${level}',`);

        lines.push('        isActive: true,');

        if (r.applicationLink && r.applicationLink.startsWith('http')) {
            lines.push(`        applicationLink: '${esc(r.applicationLink)}',`);
        }

        lines.push('    },');
        tsBlocks.push(lines.join('\n'));
    }

    const output = `import type { Scheme } from './types';

// ==========================================
// Seed Scheme Data — ${deduped.length} Government Schemes (Central + State)
// Generated from curated CSV on ${new Date().toISOString().split('T')[0]}
// ==========================================

export const SEED_SCHEMES: Scheme[] = [
${tsBlocks.join('\n')}
];
`;

    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');

    console.log(`\n[Clean] ✓ Generated ${OUTPUT_PATH}`);
    console.log(`[Clean] Total schemes: ${deduped.length}`);
    console.log('[Clean] Done!');

    // Stats
    const categories: Record<string, number> = {};
    const levels: Record<string, number> = {};
    for (const r of deduped) {
        categories[r.benefitType] = (categories[r.benefitType] || 0) + 1;
        levels[r.schemeLevel] = (levels[r.schemeLevel] || 0) + 1;
    }
    console.log('\n[Stats] By benefit type:');
    for (const [k, v] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${k}: ${v}`);
    }
    console.log('\n[Stats] By level:');
    for (const [k, v] of Object.entries(levels)) {
        console.log(`  ${k}: ${v}`);
    }
}

main();
