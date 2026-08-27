import { ClipboardList, Cpu, Award } from 'lucide-react';

const steps = [
    {
        number: 1,
        icon: ClipboardList,
        title: 'Fill Your Profile',
        description:
            'Answer simple questions about your age, income, location, and category. It takes just 2 minutes.',
    },
    {
        number: 2,
        icon: Cpu,
        title: 'AI Matches Schemes',
        description:
            'Our AI engine checks your eligibility against 289 government welfare schemes instantly.',
    },
    {
        number: 3,
        icon: Award,
        title: 'Get Recommendations',
        description:
            'See personalized scheme recommendations with clear eligibility explanations.',
    },
];

export default function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="py-20 sm:py-28 bg-bg px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-dark tracking-wide uppercase mb-4">
                        Simple Process
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">
                        How It Works
                    </h2>
                    <p className="text-lg text-text-secondary mt-3 max-w-md mx-auto">
                        Get matched with eligible government schemes in 3 simple steps
                    </p>
                </div>

                {/* Steps */}
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                    {/* Connecting line (desktop only) */}
                    <div
                        className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 border-t-2 border-dashed border-primary-200"
                        aria-hidden="true"
                    />

                    {steps.map((step) => (
                        <div key={step.number} className="relative flex flex-col items-center text-center">
                            {/* Number badge */}
                            <div className="relative z-10 mb-6">
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-md">
                                    <span className="text-white text-xl font-bold">
                                        {step.number}
                                    </span>
                                </div>
                            </div>

                            {/* Card */}
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-border-light hover:shadow-md transition-shadow duration-200 w-full">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                                    <step.icon
                                        size={24}
                                        className="text-primary"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold text-text mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
