/**
 * CSV to Seed Data Converter
 * 
 * Reads a CSV file and generates/merges into lib/seed-schemes.ts
 * 
 * Usage:
 *   npx tsx scripts/csv-to-seed.ts                          # uses data/schemes-template.csv
 *   npx tsx scripts/csv-to-seed.ts data/my-custom-file.csv  # custom CSV file
 * 
 * CSV format:
 *   - Multi-value fields (incomeCategoryAllowed, casteCategoryAllowed, etc.)
 *     use pipe separator: SC|ST|OBC
 *   - Boolean fields: true/false
 *   - Empty fields are skipped / treated as undefined
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_CSV = path.resolve(__dirname, '..', 'data', 'schemes-template.csv');
const SEED_FILE = path.resolve(__dirname, '..', 'lib', 'seed-schemes.ts');

interface CSVRow {
    [key: string]: string;
}

function parseCSV(content: string): CSVRow[] {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: CSVRow = {};
        headers.forEach((h, idx) => {
            row[h] = (values[idx] || '').trim();
        });
        rows.push(row);
    }

    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function csvRowToScheme(row: CSVRow): string {
    const id = row.id || slugify(row.name);
    const lines: string[] = [];

    lines.push(`    {`);
    lines.push(`        id: '${escape(id)}',`);
    lines.push(`        name: '${escape(row.name)}',`);
    lines.push(`        ministry: '${escape(row.ministry || 'Government of India')}',`);
    if (row.department) lines.push(`        department: '${escape(row.department)}',`);
    lines.push(`        description: '${escape(row.description || row.name)}',`);
    lines.push(`        benefitType: '${escape(row.benefitType || 'other')}',`);
    if (row.benefitAmount) lines.push(`        benefitAmount: ${parseInt(row.benefitAmount)},`);
    lines.push(`        benefitDescription: '${escape(row.benefitDescription || 'Financial assistance')}',`);

    // Eligibility block
    lines.push(`        eligibility: {`);
    if (row.minAge) lines.push(`            minAge: ${parseInt(row.minAge)},`);
    if (row.maxAge) lines.push(`            maxAge: ${parseInt(row.maxAge)},`);
    if (row.gender && row.gender !== 'any') lines.push(`            gender: '${row.gender}',`);
    if (row.maxAnnualIncome) lines.push(`            maxAnnualIncome: ${parseInt(row.maxAnnualIncome)},`);
    if (row.incomeCategoryAllowed) lines.push(`            incomeCategoryAllowed: [${row.incomeCategoryAllowed.split('|').map(s => `'${s.trim()}'`).join(', ')}],`);
    if (row.casteCategoryAllowed) lines.push(`            casteCategoryAllowed: [${row.casteCategoryAllowed.split('|').map(s => `'${s.trim()}'`).join(', ')}],`);
    if (row.employmentTypes) lines.push(`            employmentTypes: [${row.employmentTypes.split('|').map(s => `'${s.trim()}'`).join(', ')}],`);
    if (row.mustBeDisabled === 'true') lines.push(`            mustBeDisabled: true,`);
    if (row.mustBeWidow === 'true') lines.push(`            mustBeWidow: true,`);
    if (row.mustBeStudent === 'true') lines.push(`            mustBeStudent: true,`);
    if (row.mustBeFarmer === 'true') lines.push(`            mustBeFarmer: true,`);
    if (row.mustBeSeniorCitizen === 'true') lines.push(`            mustBeSeniorCitizen: true,`);
    if (row.mustHaveRationCard === 'true') lines.push(`            mustHaveRationCard: true,`);
    if (row.isMinority === 'true') lines.push(`            isMinority: true,`);
    lines.push(`        },`);

    // Documents
    const docs = row.documentsRequired
        ? row.documentsRequired.split('|').map(d => `'${escape(d.trim())}'`).join(', ')
        : "'Aadhaar Card', 'Address Proof'";
    lines.push(`        documentsRequired: [${docs}],`);

    lines.push(`        schemeLevel: '${row.schemeLevel || 'central'}',`);
    lines.push(`        isActive: true,`);
    if (row.applicationLink) lines.push(`        applicationLink: '${escape(row.applicationLink)}',`);
    lines.push(`    },`);

    return lines.join('\n');
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
}

function escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ============ Main ============

function main() {
    const csvPath = process.argv[2] || DEFAULT_CSV;

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found: ${csvPath}`);
        process.exit(1);
    }

    console.log(`[CSV Import] Reading: ${csvPath}`);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    console.log(`[CSV Import] Parsed ${rows.length} rows`);

    if (rows.length === 0) {
        console.log('[CSV Import] No data rows found.');
        return;
    }

    // Read existing seed file to check for duplicates
    let existingIds: Set<string> = new Set();
    if (fs.existsSync(SEED_FILE)) {
        const existingContent = fs.readFileSync(SEED_FILE, 'utf-8');
        const idMatches = existingContent.matchAll(/id:\s*'([^']+)'/g);
        for (const m of idMatches) {
            existingIds.add(m[1]);
        }
        console.log(`[CSV Import] Found ${existingIds.size} existing schemes in seed file`);
    }

    // Filter out duplicates
    const newRows = rows.filter(r => {
        const id = r.id || slugify(r.name);
        if (existingIds.has(id)) {
            console.log(`[CSV Import]   ⚠ Skipping duplicate: ${r.name} (${id})`);
            return false;
        }
        return true;
    });

    if (newRows.length === 0) {
        console.log('[CSV Import] All schemes already exist. Nothing to add.');
        return;
    }

    console.log(`[CSV Import] Adding ${newRows.length} new schemes...`);

    // Generate TypeScript for new schemes
    const schemeBlocks = newRows.map(r => csvRowToScheme(r));

    // Read existing file and inject before closing bracket
    if (fs.existsSync(SEED_FILE)) {
        let seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
        const lastBracketIdx = seedContent.lastIndexOf('];');
        if (lastBracketIdx !== -1) {
            const before = seedContent.slice(0, lastBracketIdx);
            const after = seedContent.slice(lastBracketIdx);
            const newContent = before + schemeBlocks.join('\n') + '\n' + after;
            fs.writeFileSync(SEED_FILE, newContent, 'utf-8');
            console.log(`[CSV Import] ✓ Added ${newRows.length} schemes to ${SEED_FILE}`);
        } else {
            console.error('[CSV Import] Could not find closing bracket in seed file.');
        }
    } else {
        // Create new seed file
        const newFile = `import type { Scheme } from './types';\n\nexport const SEED_SCHEMES: Scheme[] = [\n${schemeBlocks.join('\n')}\n];\n`;
        fs.writeFileSync(SEED_FILE, newFile, 'utf-8');
        console.log(`[CSV Import] ✓ Created ${SEED_FILE} with ${newRows.length} schemes`);
    }

    console.log('[CSV Import] Done!');
}

main();
