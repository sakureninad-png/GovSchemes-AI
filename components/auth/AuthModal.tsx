'use client';

import React, { useState } from 'react';
import { X, Mail, ArrowRight, Sparkles, Shield, BookmarkCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    async function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        if (mode === 'signup' && !name.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        // MVP: simulate OTP send (Supabase auth can be wired later)
        await new Promise((r) => setTimeout(r, 800));
        setStep('otp');
        setLoading(false);
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (otp.length < 4) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);

        // MVP: Accept any OTP (Supabase Auth will validate in production)
        await new Promise((r) => setTimeout(r, 600));

        // Check for existing profile for THIS specific email
        const profileKey = `userProfile_${email}`;
        const stored = localStorage.getItem(profileKey);
        const existingForEmail = stored ? JSON.parse(stored) : null;

        let profile;
        if (existingForEmail) {
            // Returning user — load their saved profile
            profile = existingForEmail;
        } else {
            // New user — create a fresh blank profile
            // Clear any stale profile from a different user
            const prevEmail = localStorage.getItem('currentUserEmail');
            if (prevEmail && prevEmail !== email) {
                localStorage.removeItem('userProfile');
                localStorage.removeItem('savedSchemes');
            }

            profile = {
                id: `user_${Date.now()}`,
                name: name || email.split('@')[0],
                email,
                age: 0,
                gender: '' as const,
                state: '',
                annualIncome: 0,
                incomeCategory: '' as const,
                employmentType: '' as const,
                casteCategory: '' as const,
                isDisabled: false,
                isWidow: false,
                isSeniorCitizen: false,
                isStudent: false,
                isFarmer: false,
                isMinority: false,
                educationLevel: '' as const,
                hasRationCard: false,
                needsOnboarding: true,
            };
        }

        // Track which email is currently signed in
        localStorage.setItem('currentUserEmail', email);
        // Also save under the email-specific key
        localStorage.setItem(profileKey, JSON.stringify(profile));

        login(profile);
        setLoading(false);
        resetAndClose();
    }

    function resetAndClose() {
        setEmail('');
        setName('');
        setOtp('');
        setStep('email');
        setError('');
        setMode('login');
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={resetAndClose}
            />

            {/* Modal */}
            <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                {/* Close */}
                <button
                    onClick={resetAndClose}
                    className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-secondary transition-colors cursor-pointer z-10"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header gradient */}
                <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-8 text-white">
                    <h2 className="text-2xl font-bold">
                        {step === 'otp'
                            ? 'Enter verification code'
                            : mode === 'login'
                                ? 'Welcome back!'
                                : 'Create your account'
                        }
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {step === 'otp'
                            ? `We sent a code to ${email}`
                            : mode === 'login'
                                ? 'Sign in to access your saved schemes'
                                : 'Save schemes and track your applications'
                        }
                    </p>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            {mode === 'signup' && (
                                <div>
                                    <label htmlFor="auth-name" className="block text-sm font-medium text-text mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        id="auth-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor="auth-email" className="block text-sm font-medium text-text mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        id="auth-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-bg border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                isLoading={loading}
                                rightIcon={!loading ? <ArrowRight size={16} /> : undefined}
                            >
                                {loading ? 'Sending...' : 'Continue with Email'}
                            </Button>

                            <p className="text-center text-sm text-text-muted">
                                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                                <button
                                    type="button"
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className="text-primary font-medium hover:underline cursor-pointer"
                                >
                                    {mode === 'login' ? 'Sign up' : 'Log in'}
                                </button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label htmlFor="auth-otp" className="block text-sm font-medium text-text mb-1.5">
                                    Verification Code
                                </label>
                                <input
                                    id="auth-otp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="• • • • • •"
                                    autoFocus
                                />
                                <p className="text-xs text-text-muted mt-2">
                                    For MVP demo, enter any 4+ digit code
                                </p>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                isLoading={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => { setStep('email'); setOtp(''); }}
                                className="w-full text-center text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
                            >
                                ← Back to email
                            </button>
                        </form>
                    )}

                    {/* Trust signals */}
                    {step === 'email' && (
                        <div className="mt-6 pt-5 border-t border-border-light">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                    <Shield size={18} className="text-success" />
                                    <span className="text-xs text-text-muted">Secure</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <BookmarkCheck size={18} className="text-primary" />
                                    <span className="text-xs text-text-muted">Save Schemes</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <Sparkles size={18} className="text-accent" />
                                    <span className="text-xs text-text-muted">AI Insights</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
