/**
 * Fix seed-schemes.ts data quality issues:
 * 1. Farmer schemes incorrectly tagged as mustBeSeniorCitizen → mustBeFarmer
 * 2. Broken field values (maxAge: 18 should be minAge, etc.)
 * 3. documentsRequired: ['false'] → proper documents
 * 4. Raw number benefitDescriptions → proper text
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'seed-schemes.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// =============================================
// 1. Fix farmer schemes that have mustBeSeniorCitizen instead of mustBeFarmer
// These are schemes about agriculture/farming that wrongly require senior citizen status
// =============================================

const farmerSchemeIds = [
    'pm-kisan-samman-nidhi',
    'pm-fasal-bima-yojana',
    'soil-health-card-scheme',
    'pm-krishi-sinchai-yojana',
    'e-nam',
    'rashtriya-krishi-vikas-yojana',
    'national-food-security-mission',
    'miss-interest-subvention',
    'agriculture-infrastructure-fund',
    'pm-annadata-aay-sanrakshan',
    'paramparagat-krishi-vikas',
    'kisan-credit-card',
    'rythu-bandhu',
    'kalia-scheme',
];

// For each farmer scheme, replace mustBeSeniorCitizen: true with mustBeFarmer: true
for (const id of farmerSchemeIds) {
    // Find the scheme block and replace within it
    const idPattern = new RegExp(`(id: '${id}'[\\s\\S]*?)mustBeSeniorCitizen: true`, 'g');
    const before = content;
    content = content.replace(idPattern, '$1mustBeFarmer: true');
    if (content !== before) {
        console.log(`✓ Fixed ${id}: mustBeSeniorCitizen → mustBeFarmer`);
    } else {
        console.log(`⚠ Could not find/fix ${id}`);
    }
}

// =============================================
// 2. Fix PM Kisan Maan-Dhan (needs BOTH farmer + senior for pension at 60)
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'pm-kisan-maan-dhan'[\s\S]*?)mustBeSeniorCitizen: true,/,
        '$1mustBeFarmer: true,'
    );
    if (content !== before) {
        console.log('✓ Fixed pm-kisan-maan-dhan: now mustBeFarmer (pension scheme for farmers)');
    }
}

// =============================================
// 3. Fix PM CARES for Children - should NOT have mustBeSeniorCitizen
// =============================================
{
    const before = content;
    // Remove mustBeSeniorCitizen from PM CARES
    content = content.replace(
        /(id: 'pm-cares-for-children'[\s\S]*?)mustBeSeniorCitizen: true,\n/,
        '$1'
    );
    if (content !== before) {
        console.log('✓ Fixed pm-cares-for-children: removed mustBeSeniorCitizen');
    }
}

// =============================================
// 4. Fix National Social Assistance Programme - wrongly has mustBeStudent AND mustBeWidow
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'national-social-assistance-programme'[\s\S]*?eligibility: \{[\s\S]*?)maxAge: 60,/,
        '$1minAge: 60,'
    );
    content = content.replace(
        /(id: 'national-social-assistance-programme'[\s\S]*?)mustBeStudent: true,\n/,
        '$1'
    );
    if (content !== before) {
        console.log('✓ Fixed national-social-assistance-programme: age and removed mustBeStudent');
    }
}

// =============================================
// 5. Fix PM Shram Yogi Maan-Dhan - maxAge: 18 should be minAge: 18
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'pm-shram-yogi-maan-dhan'[\s\S]*?)maxAge: 18,/,
        '$1minAge: 18,\n            maxAge: 40,'
    );
    if (content !== before) {
        console.log('✓ Fixed pm-shram-yogi-maan-dhan: maxAge:18 → minAge:18, maxAge:40');
    }
}

// =============================================
// 6. Fix PM Mudra Yojana - maxAnnualIncome: 18 is nonsense
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'pm-mudra-yojana'[\s\S]*?)maxAnnualIncome: 18,/,
        '$1minAge: 18,'
    );
    if (content !== before) {
        console.log('✓ Fixed pm-mudra-yojana: removed nonsensical maxAnnualIncome:18');
    }
}

// =============================================
// 7. Fix PM CARES maxAnnualIncome: 18
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'pm-cares-for-children'[\s\S]*?)maxAnnualIncome: 18,/,
        '$1maxAge: 18,'
    );
    if (content !== before) {
        console.log('✓ Fixed pm-cares-for-children: maxAnnualIncome:18 → maxAge:18');
    }
}

// =============================================
// 8. Fix Sambal 2.0 - maxAnnualIncome: 60 is nonsense
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'mahayojna-sambal'[\s\S]*?)maxAnnualIncome: 60,/,
        '$1minAge: 18,'
    );
    // Also remove mustBeStudent from Sambal (it's for unorganized workers, not students)
    content = content.replace(
        /(id: 'mahayojna-sambal'[\s\S]*?)mustBeStudent: true,\n/,
        '$1'
    );
    if (content !== before) {
        console.log('✓ Fixed mahayojna-sambal: removed nonsensical values');
    }
}

// =============================================
// 9. Fix benefitDescription that are just raw numbers
// =============================================
const descFixes = {
    'pm-shram-yogi-maan-dhan': {
        old: "benefitDescription: '3000'",
        new: "benefitDescription: 'Monthly pension of INR 3000 upon attaining age 60'"
    },
    'pm-mudra-yojana': {
        old: "benefitDescription: '1000000'",
        new: "benefitDescription: 'Loans up to INR 10 Lakh under Shishu, Kishor, and Tarun categories'"
    },
    'national-social-assistance-programme': {
        old: "benefitDescription: '500'",
        new: "benefitDescription: 'Monthly pension of INR 200-500 for elderly, widows, and disabled persons'"
    },
};

for (const [id, fix] of Object.entries(descFixes)) {
    const before = content;
    content = content.replace(fix.old, fix.new);
    if (content !== before) {
        console.log(`✓ Fixed ${id}: benefitDescription`);
    }
}

// =============================================
// 10. Fix Rythu Bandhu schemeLevel (it's a Telangana state scheme, not central)
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'rythu-bandhu'[\s\S]*?)schemeLevel: 'central'/,
        "$1schemeLevel: 'state'"
    );
    if (content !== before) {
        console.log('✓ Fixed rythu-bandhu: schemeLevel central → state');
    }
}

// =============================================
// 11. Fix KALIA scheme level
// =============================================
{
    const before = content;
    content = content.replace(
        /(id: 'kalia-scheme'[\s\S]*?)schemeLevel: 'central'/,
        "$1schemeLevel: 'state'"
    );
    if (content !== before) {
        console.log('✓ Fixed kalia-scheme: schemeLevel central → state');
    }
}

// =============================================
// 12. Fix documentsRequired: ['false'] → proper documents
// =============================================
// Replace ALL instances of documentsRequired: ['false'] with generic proper docs
content = content.replace(
    /documentsRequired: \['false'\]/g,
    "documentsRequired: ['Aadhaar Card', 'Identity Proof', 'Bank Account Details']"
);
console.log('✓ Fixed all documentsRequired: [false] → proper document list');

// Write back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('\n✅ All fixes applied to seed-schemes.ts');
