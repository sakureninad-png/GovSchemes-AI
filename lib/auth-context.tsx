'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, Scheme } from '@/lib/types';

// ==========================================
// Auth + Saved Schemes Context
// Uses localStorage for MVP (Supabase integration ready)
// ==========================================

interface AuthState {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    savedSchemes: string[]; // scheme IDs
}

interface AuthContextType extends AuthState {
    login: (profile: UserProfile) => void;
    logout: () => void;
    updateProfile: (profile: UserProfile) => void;
    saveScheme: (schemeId: string) => void;
    unsaveScheme: (schemeId: string) => void;
    isSchemeSaved: (schemeId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

const STORAGE_KEYS = {
    profile: 'userProfile',
    saved: 'savedSchemes',
    loggedIn: 'isLoggedIn',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        isLoggedIn: false,
        userProfile: null,
        savedSchemes: [],
    });

    // Hydrate from localStorage on mount
    useEffect(() => {
        try {
            const profile = localStorage.getItem(STORAGE_KEYS.profile);
            const saved = localStorage.getItem(STORAGE_KEYS.saved);
            const loggedIn = localStorage.getItem(STORAGE_KEYS.loggedIn);

            setState({
                isLoggedIn: loggedIn === 'true',
                userProfile: profile ? JSON.parse(profile) : null,
                savedSchemes: saved ? JSON.parse(saved) : [],
            });
        } catch {
            // Ignore parse errors
        }
    }, []);

    const login = useCallback((profile: UserProfile) => {
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        localStorage.setItem(STORAGE_KEYS.loggedIn, 'true');
        // Also sync to email-keyed storage if email is available
        const email = (profile as unknown as Record<string, unknown>).email as string | undefined;
        if (email) {
            localStorage.setItem(`userProfile_${email}`, JSON.stringify(profile));
            localStorage.setItem('currentUserEmail', email);
        }
        setState((prev) => ({
            ...prev,
            isLoggedIn: true,
            userProfile: profile,
        }));
    }, []);

    const logout = useCallback(() => {
        // Clear all auth state from localStorage
        localStorage.removeItem(STORAGE_KEYS.loggedIn);
        localStorage.removeItem(STORAGE_KEYS.profile);
        localStorage.removeItem(STORAGE_KEYS.saved);
        // Note: per-email profiles are kept so users can sign back in
        setState({
            isLoggedIn: false,
            userProfile: null,
            savedSchemes: [],
        });
    }, []);

    const updateProfile = useCallback((profile: UserProfile) => {
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        // Also sync to email-keyed storage
        const email = (profile as unknown as Record<string, unknown>).email as string | undefined;
        if (email) {
            localStorage.setItem(`userProfile_${email}`, JSON.stringify(profile));
        }
        setState((prev) => ({
            ...prev,
            userProfile: profile,
        }));
    }, []);

    const saveScheme = useCallback((schemeId: string) => {
        setState((prev) => {
            if (prev.savedSchemes.includes(schemeId)) return prev;
            const next = [...prev.savedSchemes, schemeId];
            localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next));
            return { ...prev, savedSchemes: next };
        });
    }, []);

    const unsaveScheme = useCallback((schemeId: string) => {
        setState((prev) => {
            const next = prev.savedSchemes.filter((id) => id !== schemeId);
            localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next));
            return { ...prev, savedSchemes: next };
        });
    }, []);

    const isSchemeSaved = useCallback(
        (schemeId: string) => state.savedSchemes.includes(schemeId),
        [state.savedSchemes]
    );

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                updateProfile,
                saveScheme,
                unsaveScheme,
                isSchemeSaved,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
