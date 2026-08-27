import { NextResponse } from 'next/server';
import { softMatchSchemes } from '@/lib/soft-matcher';
import { rankAndExplainSchemes, isGroqConfigured } from '@/lib/groq';
import { mmrRerank } from '@/lib/fair-reranker';
import { SEED_SCHEMES } from '@/lib/seed-schemes';
import type { UserProfile, EnhancedRecommendation, SoftMatchResult } from '@/lib/types';

// ==========================================
// POST /api/recommend — Core recommendation endpoint
// Pipeline: Soft Matcher → Groq AI → Fairness Re-Rank → Response
// Features: Soft constraints (F1), Fairness re-ranking (F4)
// ==========================================

const TOP_RECOMMENDATIONS = 20;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userProfile: UserProfile = body.userProfile || body;

        // Validate
        if (!userProfile.name || !userProfile.age || !userProfile.state) {
            return NextResponse.json(
                { error: 'Invalid profile: name, age, and state are required' },
                { status: 400 }
            );
        }

        // Ensure isSeniorCitizen is computed
        userProfile.isSeniorCitizen = userProfile.age >= 60;

        console.log(`[Recommend] Processing profile: ${userProfile.name} (age ${userProfile.age}, ${userProfile.state})`);

        // ── Stage 1: Hybrid soft constraint matching ──
        const allSchemes = SEED_SCHEMES;
        console.log(`[Recommend] Evaluating ${allSchemes.length} schemes with soft constraint matcher...`);

        const startMatch = Date.now();
        const softResults = softMatchSchemes(userProfile, allSchemes);
        const matchTime = Date.now() - startMatch;

        const eligibleCount = softResults.filter(r => r.isEligible).length;
        const nearMissCount = softResults.filter(r => r.isNearMiss).length;

        console.log(
            `[Recommend] Soft matching completed in ${matchTime}ms. ` +
            `${eligibleCount} eligible, ${nearMissCount} near-misses (${softResults.length} total).`
        );

        if (softResults.length === 0) {
            return NextResponse.json({
                recommendations: [],
                total: 0,
                message: 'No matching schemes found. Try adjusting your profile.',
                aiPowered: false,
                source: 'local_data',
                stats: { totalSchemes: allSchemes.length, matchTime },
            });
        }

        // Limit to top N for AI ranking
        const schemesToRank = softResults.slice(0, Math.min(TOP_RECOMMENDATIONS, softResults.length));

        console.log(`[Recommend] Top ${schemesToRank.length} schemes by composite score. Processing for AI ranking...`);

        // ── Stage 2: Groq AI ranking + explanation ──
        let recommendations: EnhancedRecommendation[];

        if (isGroqConfigured()) {
            try {
                const startAI = Date.now();
                const aiResults = await rankAndExplainSchemes(
                    userProfile,
                    schemesToRank.map((m) => m.scheme)
                );
                const aiTime = Date.now() - startAI;

                console.log(`[Recommend] AI ranking completed in ${aiTime}ms`);

                // Merge AI explanations with soft match results
                recommendations = schemesToRank.map((match) => {
                    const aiResult = aiResults.find((r) => r.schemeId === match.scheme.id);
                    return buildEnhancedRecommendation(match, userProfile, aiResult?.explanation || '');
                });

                // Re-sort by AI rank if available
                const aiRankMap = new Map(aiResults.map((r) => [r.schemeId, r.rank]));
                recommendations.sort((a, b) => {
                    const rankA = aiRankMap.get(a.schemeId) || 999;
                    const rankB = aiRankMap.get(b.schemeId) || 999;
                    return rankA - rankB;
                });
            } catch (aiError) {
                console.error('[Recommend] AI ranking failed, using soft-matched results:', aiError);
                recommendations = buildFallbackRecommendations(schemesToRank, userProfile);
            }
        } else {
            console.log('[Recommend] Groq not configured. Using soft-matched ranking.');
            recommendations = buildFallbackRecommendations(schemesToRank, userProfile);
        }

        // ── Stage 3: Fairness-aware re-ranking ──
        console.log('[Recommend] Applying fairness-aware re-ranking...');
        const fairReranked = mmrRerank(recommendations, userProfile);
        console.log(`[Recommend] Fairness re-ranking complete. ${fairReranked.filter(r => r.fairnessAdjusted).length} items adjusted.`);

        return NextResponse.json({
            recommendations: fairReranked,
            total: fairReranked.length,
            totalMatches: softResults.length,
            fullMatches: eligibleCount,
            nearMisses: nearMissCount,
            aiPowered: isGroqConfigured(),
            fairnessApplied: true,
            source: 'local_data',
            stats: {
                totalSchemes: allSchemes.length,
                matchTime,
                matcherVersion: 'soft-v1',
                pipelineVersion: 'fairscheme-v1',
            },
        });
    } catch (error) {
        console.error('[Recommend] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate recommendations',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

function buildEnhancedRecommendation(
    match: SoftMatchResult,
    userProfile: UserProfile,
    explanation: string
): EnhancedRecommendation {
    return {
        id: `rec_${match.scheme.id}_${Date.now()}`,
        userId: userProfile.id || 'anonymous',
        schemeId: match.scheme.id,
        scheme: match.scheme,
        matchScore: match.compositeScore,       // legacy field — now uses composite
        matchedCriteria: match.matchedCriteria,
        missedCriteria: match.missedCriteria,
        aiExplanation: explanation,
        createdAt: new Date().toISOString(),
        // Enhanced fields
        compositeScore: match.compositeScore,
        constraintScores: match.constraintScores,
        fairnessAdjusted: false,
    };
}

function buildFallbackRecommendations(
    matchResults: SoftMatchResult[],
    userProfile: UserProfile
): EnhancedRecommendation[] {
    return matchResults.map((match) =>
        buildEnhancedRecommendation(match, userProfile, match.scheme.benefitDescription)
    );
}
