import React from 'react';
import Link from 'next/link';

const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/onboarding', label: 'Find Schemes' },
    { href: '/dashboard', label: 'Dashboard' },
];

export default function Footer() {
    return (
        <footer className="bg-[#1E3A5F] text-white mt-auto">
            {/* Saffron accent border */}
            <div className="h-1 bg-accent" aria-hidden="true" />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                    {/* Column 1: Logo & Description */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-bold text-white">
                                Gov<span className="text-blue-300">Schemes</span>
                            </span>
                            <span className="text-xl font-bold text-accent">AI</span>
                        </div>
                        <p className="text-sm text-blue-200/80 leading-relaxed max-w-xs">
                            AI-powered scheme discovery for every Indian citizen. Find
                            government welfare schemes you qualify for in minutes.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-200/60 mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="
                      text-sm text-blue-100/80
                      hover:text-white
                      transition-colors duration-200
                      cursor-pointer
                    "
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Powered By */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-200/60 mb-4">
                            Powered By
                        </h3>
                        <ul className="space-y-3">
                            <li className="text-sm text-blue-100/80">
                                <span className="block font-medium text-blue-100">
                                    myScheme.gov.in
                                </span>
                                <span className="text-xs text-blue-200/60">
                                    Official Government Scheme Data
                                </span>
                            </li>
                            <li className="text-sm text-blue-100/80">
                                <span className="block font-medium text-blue-100">
                                    Groq AI
                                </span>
                                <span className="text-xs text-blue-200/60">
                                    Llama 3.3 70B — Smart Recommendations
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-blue-200/50">
                        &copy; {new Date().getFullYear()} GovSchemes AI. All rights
                        reserved.
                    </p>
                    <p className="text-xs text-blue-200/50">
                        Made with care for Indian citizens
                    </p>
                </div>
            </div>
        </footer>
    );
}
