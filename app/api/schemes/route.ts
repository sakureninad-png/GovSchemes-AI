import { NextResponse } from 'next/server';
import { SEED_SCHEMES } from '@/lib/seed-schemes';

// ==========================================
// GET /api/schemes — Fetch scheme data from local curated dataset
// Query params:
//   ?type=scholarship&level=central&search=PM
//   ?limit=100 (limit results)
// ==========================================

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const benefitType = searchParams.get('type');
        const schemeLevel = searchParams.get('level');
        const search = searchParams.get('search');
        const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 3000);

        let schemes = [...SEED_SCHEMES];

        // Search by name/description/ministry
        if (search && search.length >= 2) {
            const q = search.toLowerCase();
            schemes = schemes.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q) ||
                    s.ministry.toLowerCase().includes(q)
            );
        }

        // Filter by benefit type
        if (benefitType) {
            schemes = schemes.filter((s) => s.benefitType === benefitType);
        }

        // Filter by scheme level
        if (schemeLevel) {
            schemes = schemes.filter((s) => s.schemeLevel === schemeLevel);
        }

        // Apply limit
        schemes = schemes.slice(0, limit);

        return NextResponse.json({
            schemes,
            total: schemes.length,
            source: 'local_data',
        });
    } catch (error) {
        console.error('[Schemes API] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch schemes',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
