// ==========================================
// Groq AI Client — Ranking + Explanation
// Uses Llama 3.3 70B (free tier)
// ==========================================

import Groq from 'groq-sdk';
import type { UserProfile, Scheme } from './types';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key') {
        return null;
    }
    if (!groqClient) {
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

export function isGroqConfigured(): boolean {
    return getGroqClient() !== null;
}

export interface GroqSchemeExplanation {
    schemeId: string;
    rank: number;
    explanation: string;
}

/**
 * Send matched schemes + user profile to Groq for ranking and explanation.
 * Falls back to basic template explanations if Groq is not configured.
 */
export async function rankAndExplainSchemes(
    userProfile: UserProfile,
    schemes: Scheme[]
): Promise<GroqSchemeExplanation[]> {
    const client = getGroqClient();

    if (!client) {
        // Fallback: generate template-based explanations
        return generateFallbackExplanations(userProfile, schemes);
    }

    try {
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        // Limit to top 15 schemes to stay within token limits
        const topSchemes = schemes.slice(0, 15);

        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful Indian government scheme advisor.
Given a citizen's profile and a list of schemes they qualify for,
rank them by most beneficial and explain each in 2-3 simple sentences.
Use simple English that any citizen can understand. Do not use jargon.
Respond ONLY in valid JSON array format:
[{"schemeId": "...", "rank": 1, "explanation": "..."}]`,
                },
                {
                    role: 'user',
                    content: `User Profile: ${JSON.stringify({
                        name: userProfile.name,
                        age: userProfile.age,
                        gender: userProfile.gender,
                        state: userProfile.state,
                        annualIncome: userProfile.annualIncome,
                        incomeCategory: userProfile.incomeCategory,
                        employmentType: userProfile.employmentType,
                        casteCategory: userProfile.casteCategory,
                        isDisabled: userProfile.isDisabled,
                        isWidow: userProfile.isWidow,
                        isSeniorCitizen: userProfile.isSeniorCitizen,
                        isStudent: userProfile.isStudent,
                        isFarmer: userProfile.isFarmer,
                        educationLevel: userProfile.educationLevel,
                        hasRationCard: userProfile.hasRationCard,
                    })}

Eligible Schemes: ${JSON.stringify(
                        topSchemes.map((s) => ({
                            id: s.id,
                            name: s.name,
                            benefit: s.benefitDescription,
                            benefitType: s.benefitType,
                        }))
                    )}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 4096,
        });

        const content = response.choices[0].message.content || '[]';
        // Strip markdown code fences if present
        let cleaned = content.replace(/```json|```/g, '').trim();

        // Attempt to repair truncated JSON (common with large responses)
        try {
            return JSON.parse(cleaned);
        } catch {
            // Try to fix truncated JSON array: find last complete object
            const lastCloseBrace = cleaned.lastIndexOf('}');
            if (lastCloseBrace > 0) {
                cleaned = cleaned.slice(0, lastCloseBrace + 1) + ']';
                try {
                    return JSON.parse(cleaned);
                } catch {
                    // Still broken — fall through to fallback
                }
            }
            throw new Error('Could not parse Groq response as JSON');
        }
    } catch (error) {
        console.error('Groq API error, falling back to templates:', error);
        return generateFallbackExplanations(userProfile, schemes);
    }
}

/**
 * Generate a single scheme explanation via Groq.
 */
export async function explainScheme(
    userProfile: UserProfile,
    scheme: Scheme
): Promise<string> {
    const client = getGroqClient();

    if (!client) {
        return generateSingleFallbackExplanation(userProfile, scheme);
    }

    try {
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        const response = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful Indian government scheme advisor.
Explain why this specific scheme is relevant to this citizen in 3-4 simple sentences.
Mention the benefit amount if applicable. Use clear, simple English.
Do not use markdown formatting. Just return plain text.`,
                },
                {
                    role: 'user',
                    content: `Citizen: ${userProfile.name}, age ${userProfile.age}, ${userProfile.gender}, from ${userProfile.state}. Income: ₹${userProfile.annualIncome}/year (${userProfile.incomeCategory}). Employment: ${userProfile.employmentType}. Category: ${userProfile.casteCategory}.

Scheme: ${scheme.name}
Benefit: ${scheme.benefitDescription}
Ministry: ${scheme.ministry}`,
                },
            ],
            temperature: 0.3,
            max_tokens: 300,
        });

        return response.choices[0].message.content || generateSingleFallbackExplanation(userProfile, scheme);
    } catch (error) {
        console.error('Groq explain error:', error);
        return generateSingleFallbackExplanation(userProfile, scheme);
    }
}

// ==========================================
// Fallback: Template-based explanations (no AI)
// ==========================================

function generateFallbackExplanations(
    userProfile: UserProfile,
    schemes: Scheme[]
): GroqSchemeExplanation[] {
    return schemes.map((scheme, index) => ({
        schemeId: scheme.id,
        rank: index + 1,
        explanation: generateSingleFallbackExplanation(userProfile, scheme),
    }));
}

function generateSingleFallbackExplanation(
    userProfile: UserProfile,
    scheme: Scheme
): string {
    const parts: string[] = [];

    parts.push(
        `${scheme.name} is a ${scheme.schemeLevel} government scheme by ${scheme.ministry}.`
    );

    if (scheme.benefitDescription) {
        parts.push(`Benefit: ${scheme.benefitDescription}.`);
    }

    // Personalized note
    if (scheme.eligibility.mustBeFarmer && userProfile.isFarmer) {
        parts.push('As a farmer, you are directly eligible for this scheme.');
    } else if (scheme.eligibility.mustBeStudent && userProfile.isStudent) {
        parts.push('As a student, this scheme can support your education.');
    } else if (scheme.eligibility.mustBeSeniorCitizen && userProfile.age >= 60) {
        parts.push('As a senior citizen, you qualify for this benefit.');
    } else if (scheme.eligibility.mustBeDisabled && userProfile.isDisabled) {
        parts.push('This scheme provides special support for persons with disabilities.');
    } else if (scheme.eligibility.mustBeWidow && userProfile.isWidow) {
        parts.push('This scheme offers financial support for widows.');
    } else {
        parts.push(`Based on your profile, you meet the eligibility criteria for this scheme.`);
    }

    return parts.join(' ');
}
