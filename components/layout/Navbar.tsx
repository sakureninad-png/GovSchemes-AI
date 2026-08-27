'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/AuthModal';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/onboarding', label: 'Find Schemes' },
    { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
    const { isLoggedIn, userProfile, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    return (
        <>
            <nav
                className={`
          fixed top-4 left-4 right-4 z-50
          bg-white/90 backdrop-blur-md
          rounded-2xl
          px-6 py-3
          flex items-center justify-between
          transition-shadow duration-300
          ${isScrolled ? 'shadow-lg' : 'shadow-md'}
        `}
                aria-label="Main navigation"
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-1 shrink-0 cursor-pointer"
                    aria-label="GovSchemes AI Home"
                >
                    <span className="text-xl font-bold text-primary">
                        Gov<span className="text-primary-dark">Schemes</span>
                    </span>
                    <span className="text-xl font-bold text-accent">AI</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="
                text-sm font-medium text-text-secondary
                hover:text-primary
                transition-colors duration-200
                relative
                after:absolute after:bottom-[-4px] after:left-0 after:w-0
                after:h-[2px] after:bg-primary
                after:transition-all after:duration-200
                hover:after:w-full
                cursor-pointer
              "
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTA / Profile */}
                <div className="hidden md:flex items-center gap-3">
                    {isLoggedIn ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                    <User size={16} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium text-text max-w-[120px] truncate">
                                    {userProfile?.name || 'User'}
                                </span>
                            </button>

                            {/* Profile dropdown */}
                            {showProfileMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl border border-border-light shadow-lg z-50 overflow-hidden">
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 px-4 py-3 text-sm text-text hover:bg-bg-secondary transition-colors"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            <User size={16} />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setShowProfileMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-danger hover:bg-danger-50 transition-colors cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                                Sign In
                            </button>
                            <Link
                                href="/onboarding"
                                className="
                  inline-flex items-center justify-center
                  px-5 py-2.5
                  bg-accent text-white
                  text-sm font-semibold
                  rounded-lg
                  hover:bg-accent-dark
                  transition-all duration-200
                  shadow-sm hover:shadow-md
                  cursor-pointer
                "
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav-menu"
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMenuOpen ? (
                        <X size={24} className="text-text" />
                    ) : (
                        <Menu size={24} className="text-text" />
                    )}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Slide-in Menu */}
            <div
                id="mobile-nav-menu"
                className={`
          fixed top-0 right-0 z-50
          h-full w-72
          bg-surface shadow-xl
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Close Button */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
                    <span className="text-lg font-bold text-primary">
                        Menu
                    </span>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                        aria-label="Close menu"
                    >
                        <X size={20} className="text-text" />
                    </button>
                </div>

                {/* Mobile Nav Links */}
                <div className="px-4 py-6 flex flex-col gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="
                flex items-center
                px-4 py-3
                text-base font-medium text-text-secondary
                rounded-lg
                hover:bg-primary-50 hover:text-primary
                transition-colors duration-200
                cursor-pointer
              "
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Mobile Auth / CTA */}
                    <div className="mt-4 px-4 space-y-2">
                        {isLoggedIn ? (
                            <>
                                <div className="flex items-center gap-2 px-1 py-2 text-sm text-text-muted">
                                    <User size={16} />
                                    <span className="truncate">{userProfile?.name || 'User'}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center w-full px-5 py-3 bg-danger-50 text-danger text-base font-medium rounded-lg transition-all cursor-pointer"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setShowAuthModal(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center w-full px-5 py-3 bg-bg border border-border text-text text-base font-medium rounded-lg transition-all cursor-pointer"
                                >
                                    Sign In
                                </button>
                                <Link
                                    href="/onboarding"
                                    className="flex items-center justify-center w-full px-5 py-3 bg-accent text-white text-base font-semibold rounded-lg hover:bg-accent-dark transition-all duration-200 shadow-sm cursor-pointer"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Spacer for fixed navbar */}
            <div className="h-20" aria-hidden="true" />

            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    );
}
