/**
 * Puppeteer Scraper for myScheme.gov.in
 * 
 * One-time data collection script.
 * Visits https://www.myscheme.gov.in/search (public, lists all 4600+ schemes)
 * Then visits each scheme detail page to extract structured data.
 * 
 * Usage:
 *   npx tsx scripts/scrape-myscheme.ts
 *   npx tsx scripts/scrape-myscheme.ts --max-pages=5
 *   npx tsx scripts/scrape-myscheme.ts --max-schemes=100
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// ============ Config ============
const BASE_URL = 'https://www.myscheme.gov.in';
const SEARCH_URL = `${BASE_URL}/search`;
const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'scraped-schemes.json');
const DELAY_MS = 2000;
const MAX_SCHEMES = parseInt(process.argv.find(a => a.startsWith('--max-schemes='))?.split('=')[1] || '200');
const MAX_PAGES = parseInt(process.argv.find(a => a.startsWith('--max-pages='))?.split('=')[1] || '20');

interface ScrapedScheme {
    id: string;
    name: string;
    ministry: string;
    department: string;
    description: string;
    benefitType: string;
    benefitAmount: number | undefined;
    benefitDescription: string;
    eligibilityText: string;
    eligibility: Record<string, unknown>;
    documentsRequired: string[];
    schemeLevel: 'central' | 'state';
    applicationLink: string;
    sourceUrl: string;
    tags: string[];
    scrapedAt: string;
}

// ============ Helpers (run in Node, NOT in browser) ============

function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function guessBenefitType(text: string) {
    const t = text.toLowerCase();
    if (t.includes('scholarship') || t.includes('fellowship')) return 'scholarship';
    if (t.includes('subsidy') || t.includes('grant') || t.includes('incentive') || t.includes('stipend')) return 'subsidy';
    if (t.includes('loan') || t.includes('credit') || t.includes('finance')) return 'loan';
    if (t.includes('insurance') || t.includes('coverage')) return 'insurance';
    if (t.includes('pension') || t.includes('retirement')) return 'pension';
    if (t.includes('employment') || t.includes('skill') || t.includes('training') || t.includes('job') || t.includes('internship')) return 'employment';
    if (t.includes('housing') || t.includes('awas') || t.includes('home') || t.includes('shelter')) return 'housing';
    if (t.includes('health') || t.includes('medical') || t.includes('hospital') || t.includes('treatment')) return 'healthcare';
    return 'other';
}

function parseEligibilityFlags(text: string) {
    const t = text.toLowerCase();
    const elig: Record<string, unknown> = {};

    const ageRange = t.match(/(\d+)\s*(?:to|and|-|–|through)\s*(\d+)\s*years?/);
    if (ageRange) { elig.minAge = parseInt(ageRange[1]); elig.maxAge = parseInt(ageRange[2]); }
    else {
        const minA = t.match(/(?:minimum|above|atleast|at least)\s*(?:age\s*)?(?:of\s*)?(\d+)/);
        if (minA) elig.minAge = parseInt(minA[1]);
        const maxA = t.match(/(?:maximum|below|upto|up to|not exceeding)\s*(?:age\s*)?(?:of\s*)?(\d+)/);
        if (maxA) elig.maxAge = parseInt(maxA[1]);
    }

    if (t.includes('women') || t.includes('female') || t.includes('girl') || t.includes('widow')) elig.gender = 'female';
    else if (/\bmale\b/.test(t) && !t.includes('female')) elig.gender = 'male';

    const cc: string[] = [];
    if (t.includes('scheduled caste') || /\bsc\b/.test(t)) cc.push('SC');
    if (t.includes('scheduled tribe') || /\bst\b/.test(t)) cc.push('ST');
    if (/\bobc\b/.test(t) || t.includes('other backward')) cc.push('OBC');
    if (cc.length) elig.casteCategoryAllowed = cc;

    const ic: string[] = [];
    if (t.includes('bpl') || t.includes('below poverty')) ic.push('BPL');
    if (t.includes('ews') || t.includes('economically weaker')) ic.push('EWS');
    if (ic.length) elig.incomeCategoryAllowed = ic;

    const incMatch = t.match(/income\s*(?:upto|up to|below|less than|not exceeding)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)/);
    if (incMatch) elig.maxAnnualIncome = parseInt(incMatch[1].replace(/,/g, ''));

    if (t.includes('disab') || t.includes('pwd') || t.includes('divyang')) elig.mustBeDisabled = true;
    if (t.includes('widow')) elig.mustBeWidow = true;
    if (t.includes('student') || t.includes('studying') || t.includes('enrolled')) elig.mustBeStudent = true;
    if (t.includes('farmer') || t.includes('agriculture') || t.includes('kisan')) elig.mustBeFarmer = true;
    if (t.includes('senior citizen') || t.includes('elderly') || t.includes('old age')) elig.mustBeSeniorCitizen = true;
    if (t.includes('ration card')) elig.mustHaveRationCard = true;
    if (t.includes('minority')) elig.isMinority = true;

    return elig;
}

// ============ Main ============

async function main() {
    console.log('='.repeat(60));
    console.log('myScheme.gov.in Scraper');
    console.log('Target:', SEARCH_URL);
    console.log('Max schemes:', MAX_SCHEMES, '| Max listing pages:', MAX_PAGES);
    console.log('='.repeat(60));

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // ── Step 1: Collect scheme URLs from listing ──
    console.log('\n[Scraper] Navigating to search page...');
    await page.goto(SEARCH_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(5000); // Extra wait for React hydration

    interface ListItem { href: string; name: string; ministry: string; desc: string; tags: string[] }
    const allItems: ListItem[] = [];
    let pageNum = 0;

    while (pageNum < MAX_PAGES && allItems.length < MAX_SCHEMES) {
        pageNum++;
        console.log(`\n[Scraper] === Listing Page ${pageNum} ===`);

        // Extract scheme cards — using string-based evaluate to avoid tsx __name issue
        const items: ListItem[] = await page.evaluate(`
            (function() {
                var results = [];
                var links = document.querySelectorAll("a[href^='/schemes/']");
                links.forEach(function(link) {
                    var href = link.getAttribute('href') || '';
                    var name = (link.textContent || '').trim();
                    if (!name || name.length < 3 || !href) return;

                    var card = link.closest('div');
                    var fullCard = card ? (card.parentElement ? (card.parentElement.parentElement || card.parentElement) : card) : link.parentElement;

                    var ministryEl = fullCard ? fullCard.querySelector('h2[aria-label^="Filter by"]') : null;
                    var ministry = ministryEl ? (ministryEl.textContent || '').trim() : '';

                    var tagEls = fullCard ? fullCard.querySelectorAll('div[aria-label^="Filter by tag:"]') : [];
                    var tags = [];
                    tagEls.forEach(function(t) { if (t.textContent) tags.push(t.textContent.trim()); });

                    var desc = '';
                    if (fullCard) {
                        desc = (fullCard.textContent || '').replace(name, '').replace(ministry, '');
                        tags.forEach(function(t) { desc = desc.replace(t, ''); });
                        desc = desc.replace(/\\s+/g, ' ').trim().slice(0, 250);
                    }

                    results.push({
                        href: 'https://www.myscheme.gov.in' + href,
                        name: name,
                        ministry: ministry,
                        desc: desc,
                        tags: tags
                    });
                });
                return results;
            })()
        `) as ListItem[];

        console.log('[Scraper] Found', items.length, 'schemes');
        for (const it of items) console.log('  •', it.name);

        allItems.push(...items);
        if (allItems.length >= MAX_SCHEMES) break;

        // Click the ">" next page button
        // The pagination has numbered buttons + a ">" at the end
        const clicked = await page.evaluate(`
            (function() {
                // Find all pagination-like containers
                var allLis = document.querySelectorAll('li');
                for (var i = 0; i < allLis.length; i++) {
                    var li = allLis[i];
                    var text = (li.textContent || '').trim();
                    if (text === '>') {
                        var btn = li.querySelector('button') || li.querySelector('a') || li;
                        if (btn && !btn.disabled) {
                            btn.click();
                            return true;
                        }
                    }
                }
                // Fallback: look for any button/link with > or Next text
                var buttons = document.querySelectorAll('button, a');
                for (var j = 0; j < buttons.length; j++) {
                    var bt = buttons[j];
                    var txt = (bt.textContent || '').trim();
                    if ((txt === '>' || txt === '›' || txt === 'Next') && !bt.disabled) {
                        bt.click();
                        return true;
                    }
                }
                return false;
            })()
        `) as boolean;

        if (!clicked) {
            console.log('[Scraper] No next page button found. Stopping pagination.');
            break;
        }

        console.log('[Scraper] Clicked next, waiting for page to load...');
        await wait(4000);

        // Verify new content loaded
        try {
            await page.waitForSelector("a[href^='/schemes/']", { timeout: 10000 });
        } catch {
            console.log('[Scraper] Timed out waiting for next page content.');
            break;
        }
        await wait(1000);
    }

    // Deduplicate
    const uniqueItems = allItems.filter((item, idx, arr) =>
        arr.findIndex(x => x.href === item.href) === idx
    ).slice(0, MAX_SCHEMES);

    console.log('\n[Scraper] Total unique scheme links:', uniqueItems.length);

    // ── Step 2: Visit each detail page ──
    console.log('\n' + '='.repeat(60));
    console.log('[Scraper] Scraping', uniqueItems.length, 'detail pages...');
    console.log('='.repeat(60));

    const schemes: ScrapedScheme[] = [];

    for (let i = 0; i < uniqueItems.length; i++) {
        const item = uniqueItems[i];
        console.log(`\n[${i + 1}/${uniqueItems.length}] ${item.name}`);

        try {
            await page.goto(item.href, { waitUntil: 'networkidle0', timeout: 25000 });
            await wait(2500);

            // Extract all data using string-based evaluate (avoids tsx __name issue)
            const raw = await page.evaluate(`
                (function() {
                    var body = document.body;
                    var fullText = (body.textContent || '').toLowerCase();

                    // Title
                    var h1 = document.querySelector('h1');
                    var title = h1 ? (h1.textContent || '').trim() : '';

                    // Ministry
                    var ministryEl = document.querySelector('h2[aria-label^="Filter by"]');
                    var ministry = '';
                    if (ministryEl) {
                        ministry = (ministryEl.textContent || '').trim();
                    } else {
                        var allEls = document.querySelectorAll('p, span, div, h2, h3');
                        for (var i = 0; i < allEls.length; i++) {
                            var txt = (allEls[i].textContent || '').trim();
                            if (txt.indexOf('Ministry') === 0 || txt.indexOf('Department of') === 0) {
                                ministry = txt;
                                break;
                            }
                        }
                    }

                    // Find section content by heading text
                    function findSection(name) {
                        var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                        for (var h = 0; h < headings.length; h++) {
                            var hText = (headings[h].textContent || '').trim().toLowerCase();
                            if (hText.indexOf(name.toLowerCase()) !== -1) {
                                var content = '';
                                var sib = headings[h].nextElementSibling;
                                var count = 0;
                                while (sib && count < 10) {
                                    var tag = sib.tagName;
                                    if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') break;
                                    content += (sib.textContent || '').trim() + '\\n';
                                    sib = sib.nextElementSibling;
                                    count++;
                                }
                                return content.trim();
                            }
                        }
                        return '';
                    }

                    // Find list items under a section heading
                    function findSectionList(name) {
                        var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                        for (var h = 0; h < headings.length; h++) {
                            var hText = (headings[h].textContent || '').trim().toLowerCase();
                            if (hText.indexOf(name.toLowerCase()) !== -1) {
                                var sib = headings[h].nextElementSibling;
                                var count = 0;
                                while (sib && count < 5) {
                                    var lis = sib.querySelectorAll('li');
                                    if (lis.length > 0) {
                                        var items = [];
                                        lis.forEach(function(li) {
                                            var t = (li.textContent || '').trim();
                                            if (t.length > 2) items.push(t);
                                        });
                                        return items;
                                    }
                                    var tag = sib.tagName;
                                    if (tag === 'H1' || tag === 'H2' || tag === 'H3') break;
                                    sib = sib.nextElementSibling;
                                    count++;
                                }
                            }
                        }
                        return [];
                    }

                    var details = findSection('Details') || findSection('About');
                    var benefits = findSection('Benefits') || findSection('Benefit');
                    var eligibility = findSection('Eligibility') || findSection('Eligible');
                    var docs = findSectionList('Documents Required');
                    if (docs.length === 0) docs = findSectionList('Document');

                    var isState = fullText.indexOf('state government') !== -1 || fullText.indexOf('state scheme') !== -1;

                    // Application link
                    var applyLink = '';
                    var allAnchors = document.querySelectorAll('a');
                    for (var a = 0; a < allAnchors.length; a++) {
                        var aText = (allAnchors[a].textContent || '').toLowerCase();
                        if (aText.indexOf('apply') !== -1 || aText.indexOf('official website') !== -1) {
                            applyLink = allAnchors[a].href;
                            break;
                        }
                    }

                    return {
                        title: title,
                        ministry: ministry,
                        details: (details || '').slice(0, 500),
                        benefits: (benefits || '').slice(0, 400),
                        eligibility: (eligibility || '').slice(0, 500),
                        docs: docs.slice(0, 15),
                        isState: isState,
                        applyLink: applyLink
                    };
                })()
            `) as { title: string; ministry: string; details: string; benefits: string; eligibility: string; docs: string[]; isState: boolean; applyLink: string };

            if (!raw.title || raw.title.length < 3) {
                console.log('  ⚠ Skipped (no title)');
                continue;
            }

            const combinedText = `${item.desc} ${raw.benefits} ${raw.details} ${item.tags.join(' ')}`;
            const eligText = raw.eligibility || raw.details || '';

            const scheme: ScrapedScheme = {
                id: slugify(item.name || raw.title),
                name: item.name || raw.title,
                ministry: raw.ministry || item.ministry || 'Government of India',
                department: '',
                description: raw.details || item.desc || item.name,
                benefitType: guessBenefitType(combinedText),
                benefitAmount: undefined,
                benefitDescription: raw.benefits || 'Financial assistance and support',
                eligibilityText: eligText,
                eligibility: parseEligibilityFlags(eligText),
                documentsRequired: raw.docs.length > 0 ? raw.docs : ['Aadhaar Card', 'Address Proof'],
                schemeLevel: raw.isState ? 'state' : 'central',
                applicationLink: raw.applyLink || item.href,
                sourceUrl: item.href,
                tags: item.tags,
                scrapedAt: new Date().toISOString(),
            };

            console.log(`  ✓ ${scheme.benefitType} | ${scheme.documentsRequired.length} docs`);
            schemes.push(scheme);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`  ✗ Error: ${msg}`);
        }

        await wait(DELAY_MS);
    }

    // Deduplicate by name
    const deduped = schemes.filter((s, i, arr) =>
        arr.findIndex(x => x.name.toLowerCase() === s.name.toLowerCase()) === i
    );

    // ── Step 3: Save ──
    const output = {
        scrapedAt: new Date().toISOString(),
        totalSchemes: deduped.length,
        source: 'myscheme.gov.in/search',
        schemes: deduped,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('[Scraper] Done! Scraped', deduped.length, 'schemes.');
    console.log('[Scraper] Output:', OUTPUT_FILE);
    console.log('='.repeat(60));

    await browser.close();
}

main().catch(err => {
    console.error('Scraper failed:', err);
    process.exit(1);
});
