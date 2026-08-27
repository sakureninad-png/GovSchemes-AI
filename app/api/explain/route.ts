import { NextResponse } from 'next/server';
import { explainScheme } from '@/lib/groq';
import type { UserProfile, Scheme } from '@/lib/types';

// ==========================================
// POST /api/explain — Generate AI explanation for a scheme+user pair
// ==========================================

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userProfile, scheme, schemeId }: { userProfile: UserProfile; scheme?: Scheme; schemeId?: string } = body;

        if (!userProfile || !scheme) {
            return NextResponse.json(
                { error: 'userProfile and scheme are required' },
                { status: 400 }
            );
        }

        const explanation = await explainScheme(userProfile, scheme);

        return NextResponse.json({
            schemeId: schemeId || scheme.id,
            schemeName: scheme.name,
            explanation,
        });
    } catch (error) {
        console.error('Explain error:', error);
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
