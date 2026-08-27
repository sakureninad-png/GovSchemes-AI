'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ExternalLink,
    Share2,
    CheckCircle2,
    XCircle,
    FileText,
    Building2,
    Award,
    Sparkles,
    Bookmark,
    BookmarkCheck,
    Info,
    Clock,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CounterfactualCard from '@/components/schemes/CounterfactualCard';
import type { Scheme, UserProfile, Counterfactual } from '@/lib/types';
import { softMatchSchemes } from '@/lib/soft-matcher';
import { useAuth } from '@/lib/auth-context';

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-accent';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-success-50 border-success';
    if (score >= 60) return 'bg-warning-50 border-warning';
    return 'bg-accent-50 border-accent';
}

const benefitTypeLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'danger' }> = {
    scholarship: { label: 'Scholarship', variant: 'info' },
    subsidy: { label: 'Subsidy', variant: 'success' },
    loan: { label: 'Loan', variant: 'default' },
    insurance: { label: 'Insurance', variant: 'info' },
    pension: { label: 'Pension', variant: 'warning' },
    employment: { label: 'Employment', variant: 'success' },
    housing: { label: 'Housing', variant: 'default' },
    healthcare: { label: 'Healthcare', variant: 'info' },
    other: { label: 'Benefit', variant: 'default' },
};

export default function SchemeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { saveScheme, unsaveScheme, isSchemeSaved } = useAuth();
    const schemeId = params.id as string;

    const [scheme, setScheme] = useState<Scheme | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [matchScore, setMatchScore] = useState<number>(0);
    const [matchedCriteria, setMatchedCriteria] = useState<string[]>([]);
    const [missedCriteria, setMissedCriteria] = useState<string[]>([]);
    const [aiExplanation, setAiExplanation] = useState<string>('');
    const [counterfactuals, setCounterfactuals] = useState<Counterfactual[]>([]);
    const [loading, setLoading] = useState(true);
    const [explaining, setExplaining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSchemeDetail() {
            setLoading(true);
            try {
                // Fetch scheme data
                const res = await fetch('/api/schemes?limit=1000');
                if (!res.ok) throw new Error('Failed to fetch schemes');
                const data = await res.json();
                const found = data.schemes.find((s: Scheme) => s.id === schemeId);
                if (!found) {
                    setError('Scheme not found');
                    setLoading(false);
                    return;
                }
                setScheme(found);

                // Get user profile from localStorage and run matcher
                const stored = localStorage.getItem('userProfile');
                if (stored) {
                    const profile: UserProfile = JSON.parse(stored);
                    profile.isSeniorCitizen = profile.age >= 60;
                    setUserProfile(profile);

                    // Use soft matcher for continuous scoring
                    const results = softMatchSchemes(profile, [found]);
                    if (results.length > 0) {
                        setMatchScore(results[0].compositeScore);
                        setMatchedCriteria(results[0].matchedCriteria);
                        setMissedCriteria(results[0].missedCriteria);
                    }

                    // Fetch counterfactuals if there are missed criteria
                    if (results.length > 0 && results[0].missedCriteria.length > 0) {
                        try {
                            const cfRes = await fetch('/api/counterfactual', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userProfile: profile, schemeId: found.id }),
                            });
                            if (cfRes.ok) {
                                const cfData = await cfRes.json();
                                setCounterfactuals(cfData.counterfactuals || []);
                            }
                        } catch (cfErr) {
                            console.error('Failed to fetch counterfactuals:', cfErr);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load scheme details');
            } finally {
                setLoading(false);
            }
        }

        loadSchemeDetail();
    }, [schemeId]);

    // Fetch AI explanation
    async function fetchExplanation() {
        if (!userProfile || !scheme) return;
        setExplaining(true);
        try {
            const res = await fetch('/api/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userProfile, schemeId: scheme.id, scheme }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setAiExplanation(data.explanation);
        } catch {
            setAiExplanation(scheme.benefitDescription);
        } finally {
            setExplaining(false);
        }
    }

    // Share
    function handleShare() {
        if (navigator.share && scheme) {
            navigator.share({
                title: scheme.name,
                text: `Check out this government scheme: ${scheme.name}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <PageWrapper className="py-10">
                    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
                        <div className="h-6 bg-bg-secondary rounded w-32" />
                        <div className="h-10 bg-bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-bg-secondary rounded w-1/2" />
                        <div className="h-48 bg-bg-secondary rounded-2xl" />
                        <div className="h-48 bg-bg-secondary rounded-2xl" />
                    </div>
                </PageWrapper>
            </>
        );
    }

    if (error || !scheme) {
        return (
            <>
                <Navbar />
                <PageWrapper className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-50 flex items-center justify-center">
                        <XCircle size={28} className="text-danger" />
                    </div>
                    <h1 className="text-2xl font-bold text-text mb-2">
                        {error || 'Scheme not found'}
                    </h1>
                    <p className="text-text-secondary mb-6">
                        The scheme you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
                    </p>
                    <Button variant="primary" onClick={() => router.push('/results')}>
                        <ArrowLeft size={16} className="mr-2" /> Back to Results
                    </Button>
                </PageWrapper>
            </>
        );
    }

    const benefitInfo = benefitTypeLabels[scheme.benefitType] || benefitTypeLabels.other;

    return (
        <>
            <Navbar />
            <PageWrapper className="py-6 sm:py-10">
                <div className="max-w-3xl mx-auto">
                    {/* Back link */}
                    <Link
                        href="/results"
                        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft size={16} />
                        Back to Results
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant={benefitInfo.variant}>{benefitInfo.label}</Badge>
                            <Badge variant={scheme.schemeLevel === 'central' ? 'info' : 'default'}>
                                {scheme.schemeLevel === 'central' ? 'Central Govt' : 'State Govt'}
                            </Badge>
                            {scheme.isActive && <Badge variant="success">Active</Badge>}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-text leading-snug">
                            {scheme.name}
                        </h1>

                        <div className="flex items-center gap-2 mt-2">
                            <Building2 size={16} className="text-text-muted shrink-0" />
                            <p className="text-sm text-text-secondary">{scheme.ministry}</p>
                        </div>

                        {scheme.department && (
                            <p className="text-sm text-text-muted mt-1 ml-6">{scheme.department}</p>
                        )}
                    </div>

                    {/* Match Score + Actions bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 sm:p-5 bg-surface rounded-2xl border border-border-light shadow-sm">
                        <div className="flex items-center gap-4">
                            {userProfile && (
                                <div className={`w-16 h-16 rounded-full border-[3px] ${getScoreBg(matchScore)} flex items-center justify-center`}>
                                    <span className={`text-lg font-bold ${getScoreColor(matchScore)}`}>
                                        {matchScore}%
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-text">
                                    {matchScore === 100
                                        ? 'You fully qualify!'
                                        : matchScore >= 80
                                            ? 'Strong match'
                                            : missedCriteria.length > 0
                                                ? 'Near match'
                                                : 'Check eligibility'
                                    }
                                </p>
                                {scheme.benefitAmount && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Award size={14} className="text-primary" />
                                        <span className="text-sm font-semibold text-primary">
                                            Benefit: ₹{scheme.benefitAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="p-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer"
                                title="Share"
                            >
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={() => isSchemeSaved(scheme.id) ? unsaveScheme(scheme.id) : saveScheme(scheme.id)}
                                className={`p-2.5 rounded-lg transition-colors cursor-pointer ${isSchemeSaved(scheme.id) ? 'text-primary bg-primary-50' : 'text-text-muted hover:text-primary hover:bg-primary-50'}`}
                                title={isSchemeSaved(scheme.id) ? 'Unsave scheme' : 'Save scheme'}
                            >
                                {isSchemeSaved(scheme.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                            </button>
                            {scheme.applicationLink && (
                                <a
                                    href={scheme.applicationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors shadow-sm"
                                >
                                    Apply Now
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <section className="mb-6">
                        <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
                            <Info size={18} className="text-primary" />
                            About This Scheme
                        </h2>
                        <p className="text-text-secondary leading-relaxed">
                            {scheme.description}
                        </p>
                        <p className="text-text-secondary mt-3 leading-relaxed">
                            <strong>Benefit:</strong> {scheme.benefitDescription}
                        </p>
                    </section>

                    {/* Eligibility Checklist */}
                    {userProfile && (matchedCriteria.length > 0 || missedCriteria.length > 0) && (
                        <section className="mb-6 bg-surface rounded-2xl border border-border-light p-5 sm:p-6">
                            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-success" />
                                Eligibility Checklist
                            </h2>

                            <div className="space-y-2.5">
                                {matchedCriteria.map((c, i) => (
                                    <div key={`match-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-success-50/50">
                                        <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                                        <span className="text-sm text-text">{c}</span>
                                    </div>
                                ))}
                                {missedCriteria.map((c, i) => (
                                    <div key={`miss-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-danger-50/50">
                                        <XCircle size={18} className="text-danger shrink-0 mt-0.5" />
                                        <span className="text-sm text-text">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Counterfactual Explanations — Feature 2 */}
                    {userProfile && missedCriteria.length > 0 && counterfactuals.length > 0 && (
                        <CounterfactualCard
                            counterfactuals={counterfactuals}
                            schemeName={scheme.name}
                        />
                    )}

                    {/* AI Explanation */}
                    <section className="mb-6 bg-primary-50 rounded-2xl border border-primary-200 p-5 sm:p-6">
                        <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                            <Sparkles size={18} className="text-primary" />
                            AI Explanation
                        </h2>

                        {aiExplanation ? (
                            <p className="text-text-secondary leading-relaxed">{aiExplanation}</p>
                        ) : (
                            <div>
                                <p className="text-sm text-text-muted mb-3">
                                    Get a personalized explanation of how this scheme benefits you.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={fetchExplanation}
                                    isLoading={explaining}
                                    leftIcon={!explaining ? <Sparkles size={14} /> : undefined}
                                >
                                    {explaining ? 'Generating...' : 'Generate Explanation'}
                                </Button>
                            </div>
                        )}
                    </section>

                    {/* Documents Required */}
                    {scheme.documentsRequired.length > 0 && (
                        <section className="mb-6 bg-surface rounded-2xl border border-border-light p-5 sm:p-6">
                            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                Documents Required
                            </h2>

                            <ul className="space-y-2">
                                {scheme.documentsRequired.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        {doc}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Apply CTA */}
                    <section className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 sm:p-8 text-center text-white">
                        <h2 className="text-xl font-bold mb-2">Ready to Apply?</h2>
                        <p className="text-blue-100 text-sm mb-5">
                            Gather the documents listed above and apply through the official portal.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            {scheme.applicationLink ? (
                                <a
                                    href={scheme.applicationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors shadow-md"
                                >
                                    Apply Now
                                    <ExternalLink size={16} />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 text-blue-200 text-sm">
                                    <Clock size={16} />
                                    Application link coming soon
                                </div>
                            )}
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                            >
                                <Share2 size={16} />
                                Share Scheme
                            </button>
                        </div>
                    </section>
                </div>
            </PageWrapper>
        </>
    );
}
