import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function TrustSection() {
    return (
        <section className="bg-[#1E3A5F] py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center">
                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-xs font-semibold tracking-wide uppercase mb-6">
                        <ShieldCheck size={14} aria-hidden="true" />
                        Official Data Source
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        Powered by Official Government Data
                    </h2>
                    <p className="text-lg text-blue-200/80 mt-4 max-w-2xl mx-auto leading-relaxed">
                        All scheme information comes directly from{' '}
                        <strong className="text-white">myScheme.gov.in</strong> — the
                        official Indian Government portal for welfare schemes.
                    </p>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-14">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={24} className="text-blue-200" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            myScheme.gov.in
                        </h3>
                        <p className="text-sm text-blue-200/70">
                            Official Government of India portal with verified scheme data
                            from all 36 states and union territories.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors duration-200">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <Zap size={24} className="text-accent-light" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Groq AI
                        </h3>
                        <p className="text-sm text-blue-200/70">
                            Powered by Llama 3.3 70B for intelligent scheme matching and
                            plain-language explanations you can understand.
                        </p>
                    </div>
                </div>

                {/* Final CTA */}
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
            shadow-lg hover:shadow-xl hover:-translate-y-0.5
            cursor-pointer
            group
          "
                >
                    Start Finding Your Schemes
                    <ArrowRight
                        size={20}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                    />
                </Link>
                <p className="text-sm text-blue-200/50 mt-4">
                    No registration required to start
                </p>
            </div>
        </section>
    );
}
