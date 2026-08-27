import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50 to-primary-100">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-success/5 blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left — Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-dark tracking-wide uppercase">
                                Free for all Indian Citizens
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-text leading-tight tracking-tight">
                                Find Government Schemes{' '}
                                <span className="text-primary">You Qualify For</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Answer a few questions about yourself and our AI will match you
                                with welfare schemes from{' '}
                                <span className="font-semibold text-text">289</span>{' '}
                                central and state government programs. Free, instant, and powered by official data.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/onboarding"
                                className="
                  inline-flex items-center justify-center gap-2
                  px-8 py-4
                  bg-accent text-white
                  text-lg font-semibold
                  rounded-xl
                  hover:bg-accent-dark
                  transition-all duration-200
                  shadow-md hover:shadow-lg hover:-translate-y-0.5
                  cursor-pointer
                  group
                "
                            >
                                Check My Eligibility
                                <ArrowRight
                                    size={20}
                                    className="transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="
                  inline-flex items-center justify-center gap-2
                  px-8 py-4
                  bg-transparent text-primary
                  border-2 border-primary
                  text-lg font-semibold
                  rounded-xl
                  hover:bg-primary-50
                  transition-all duration-200
                  cursor-pointer
                "
                            >
                                Learn How It Works
                                <ChevronDown size={20} aria-hidden="true" />
                            </a>
                        </div>
                    </div>

                    {/* Right — Abstract Illustration */}
                    <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
                        <div className="relative w-full max-w-lg">
                            {/* Central citizen card */}
                            <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 mx-auto w-72">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text">Your Profile</p>
                                        <p className="text-xs text-text-muted">Match in progress...</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-primary rounded-full" />
                                    </div>
                                    <p className="text-xs text-text-muted text-right">80% complete</p>
                                </div>
                            </div>

                            {/* Floating scheme cards */}
                            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 w-48 animate-float-slow">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text leading-tight">PM Kisan Yojana</p>
                                        <p className="text-[10px] text-success-dark font-medium">95% Match</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-3 w-52 animate-float-delayed">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8C00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text leading-tight">Scholarship Scheme</p>
                                        <p className="text-[10px] text-accent-dark font-medium">87% Match</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-1/2 -right-8 bg-white rounded-xl shadow-lg p-3 w-44 animate-float-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text leading-tight">Housing Aid</p>
                                        <p className="text-[10px] text-primary font-medium">72% Match</p>
                                    </div>
                                </div>
                            </div>

                            {/* Background decorative circles */}
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-dashed border-primary-200 opacity-40" />
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed border-primary-100 opacity-30" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
