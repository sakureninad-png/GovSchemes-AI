import { NextResponse } from 'next/server';

// ==========================================
// POST /api/profile — Save user profile
// GET  /api/profile — Retrieve profile (by id query param)
// ==========================================

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.age || !body.gender || !body.state) {
            return NextResponse.json(
                { error: 'Missing required fields: name, age, gender, state' },
                { status: 400 }
            );
        }

        // For MVP without Supabase configured, generate an ID and return the profile
        const profile = {
            id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            ...body,
            isSeniorCitizen: body.age >= 60,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ profile }, { status: 201 });
    } catch (error) {
        console.error('Profile save error:', error);
        return NextResponse.json(
            { error: 'Failed to save profile' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Profile ID is required' },
                { status: 400 }
            );
        }

        // For MVP, profiles are handled client-side via localStorage
        return NextResponse.json(
            { error: 'Profile not found — using client-side storage in MVP' },
            { status: 404 }
        );
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}
