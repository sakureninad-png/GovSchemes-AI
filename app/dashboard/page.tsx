'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    Bookmark,
    RotateCw,
    MapPin,
    Briefcase,
    GraduationCap,
    Calendar,
    ArrowRight,
    Trash2,
    LogIn,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import type { Scheme } from '@/lib/types';

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

export default function DashboardPage() {
    const router = useRouter();
    const { isLoggedIn, userProfile, savedSchemes, unsaveScheme } = useAuth();
    const [savedSchemeDetails, setSavedSchemeDetails] = useState<Scheme[]>([]);
    const [loadingSchemes, setLoadingSchemes] = useState(true);

    // Fetch saved scheme details
    useEffect(() => {
        async function loadSavedSchemes() {
            if (savedSchemes.length === 0) {
                setSavedSchemeDetails([]);
                setLoadingSchemes(false);
                return;
            }

            try {
                const res = await fetch('/api/schemes');
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                const details = data.schemes.filter((s: Scheme) =>
                    savedSchemes.includes(s.id)
                );
                setSavedSchemeDetails(details);
            } catch {
                setSavedSchemeDetails([]);
            } finally {
                setLoadingSchemes(false);
            }
        }

        loadSavedSchemes();
    }, [savedSchemes]);

    // Not logged in state
    if (!isLoggedIn) {
        return (
            <>
                <Navbar />
                <PageWrapper className="py-16 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                            <LogIn size={32} className="text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-text mb-3">
                            Sign in to access your dashboard
                        </h1>
                        <p className="text-text-secondary mb-6">
                            Save schemes, track your profile, and get personalized recommendations.
                        </p>
                        <p className="text-sm text-text-muted mb-4">
                            Click the <strong>&quot;Sign In&quot;</strong> button in the navbar to get started.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => router.push('/onboarding')}
                        >
                            Find Schemes First
                        </Button>
                    </div>
                </PageWrapper>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <PageWrapper className="py-6 sm:py-10">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-text">Your Dashboard</h1>
                        <p className="text-text-secondary mt-1">
                            Manage your profile and saved schemes
                        </p>
                    </div>

                    {/* Profile Summary Card */}
                    {userProfile && (
                        <section className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 mb-8">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold">
                                        {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-text">
                                            {userProfile.name}
                                        </h2>
                                        <p className="text-sm text-text-muted">
                                            Profile last updated: {userProfile.updatedAt
                                                ? new Date(userProfile.updatedAt).toLocaleDateString('en-IN')
                                                : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                <Link href="/onboarding">
                                    <Button variant="secondary" size="sm">
                                        Edit Profile
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center gap-2.5 p-3 bg-bg rounded-xl">
                                    <Calendar size={18} className="text-primary shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-muted">Age</p>
                                        <p className="text-sm font-semibold text-text">{userProfile.age} years</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 bg-bg rounded-xl">
                                    <MapPin size={18} className="text-accent shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-muted">State</p>
                                        <p className="text-sm font-semibold text-text truncate">{userProfile.state || 'Not set'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 bg-bg rounded-xl">
                                    <Briefcase size={18} className="text-success shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-muted">Employment</p>
                                        <p className="text-sm font-semibold text-text capitalize">{userProfile.employmentType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 bg-bg rounded-xl">
                                    <GraduationCap size={18} className="text-warning shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-muted">Education</p>
                                        <p className="text-sm font-semibold text-text capitalize">{userProfile.educationLevel}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Quick Actions */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => router.push('/results')}
                            className="flex items-center gap-4 p-5 bg-primary-50 border border-primary-200 rounded-2xl hover:bg-primary-100 transition-colors text-left cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                <RotateCw size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                                    Re-run Recommendations
                                </h3>
                                <p className="text-sm text-text-muted">
                                    Check for new matching schemes
                                </p>
                            </div>
                            <ArrowRight size={18} className="text-text-muted ml-auto group-hover:text-primary transition-colors" />
                        </button>

                        <button
                            onClick={() => router.push('/onboarding')}
                            className="flex items-center gap-4 p-5 bg-accent-50 border border-accent-200 rounded-2xl hover:bg-accent-100 transition-colors text-left cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                                <User size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-text group-hover:text-accent transition-colors">
                                    Update Profile
                                </h3>
                                <p className="text-sm text-text-muted">
                                    Improve your match accuracy
                                </p>
                            </div>
                            <ArrowRight size={18} className="text-text-muted ml-auto group-hover:text-accent transition-colors" />
                        </button>
                    </section>

                    {/* Saved Schemes */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Bookmark size={20} className="text-primary" />
                                <h2 className="text-xl font-semibold text-text">
                                    Saved Schemes
                                </h2>
                                {savedSchemes.length > 0 && (
                                    <Badge variant="default" size="sm">
                                        {savedSchemes.length}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {loadingSchemes ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-surface rounded-xl border border-border-light p-5 animate-pulse">
                                        <div className="flex items-center gap-4">
                                            <div className="h-5 bg-bg-secondary rounded w-3/4" />
                                            <div className="h-8 bg-bg-secondary rounded-lg w-20 ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : savedSchemeDetails.length === 0 ? (
                            <div className="text-center py-12 bg-surface rounded-2xl border border-border-light">
                                <Bookmark size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                                <h3 className="text-lg font-semibold text-text mb-1">
                                    No saved schemes yet
                                </h3>
                                <p className="text-sm text-text-muted mb-4">
                                    Browse recommendations and save schemes you&apos;re interested in.
                                </p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push('/results')}
                                >
                                    Browse Schemes
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedSchemeDetails.map((scheme) => {
                                    const benefit = benefitTypeLabels[scheme.benefitType] || benefitTypeLabels.other;
                                    return (
                                        <div
                                            key={scheme.id}
                                            className="bg-surface rounded-xl border border-border-light p-5 hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-text truncate">
                                                        {scheme.name}
                                                    </h3>
                                                    <p className="text-xs text-text-muted mt-0.5 truncate">
                                                        {scheme.ministry}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant={benefit.variant} size="sm">
                                                            {benefit.label}
                                                        </Badge>
                                                        {scheme.benefitAmount && (
                                                            <span className="text-xs font-semibold text-primary">
                                                                ₹{scheme.benefitAmount.toLocaleString('en-IN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => unsaveScheme(scheme.id)}
                                                        className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-50 transition-colors cursor-pointer"
                                                        title="Remove from saved"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <Link href={`/scheme/${scheme.id}`}>
                                                        <Button variant="secondary" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </PageWrapper>
        </>
    );
}
