import { NextResponse } from 'next/server';
import { computeCounterfactuals } from '@/lib/counterfactual';
import { evaluateSoftEligibility } from '@/lib/soft-matcher';
import { SEED_SCHEMES } from '@/lib/seed-schemes';
import type { UserProfile } from '@/lib/types';

// ==========================================
// POST /api/counterfactual — Counterfactual Explainability
// Feature 2: "What would make you eligible?"
// ==========================================

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userProfile, schemeId }: { userProfile: UserProfile; schemeId: string } = body;

        if (!userProfile || !schemeId) {
            return NextResponse.json(
                { error: 'userProfile and schemeId are required' },
                { status: 400 }
            );
        }

        // Ensure computed fields
        userProfile.isSeniorCitizen = userProfile.age >= 60;

        // Find the scheme
        const scheme = SEED_SCHEMES.find(s => s.id === schemeId);
        if (!scheme) {
            return NextResponse.json(
                { error: `Scheme not found: ${schemeId}` },
                { status: 404 }
            );
        }

        // Get soft constraint scores
        const constraintScores = evaluateSoftEligibility(userProfile, scheme);

        // Generate counterfactuals
        const result = computeCounterfactuals(userProfile, scheme, constraintScores);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Counterfactual] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate counterfactuals',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
