import { FileText, MapPin, Heart } from 'lucide-react';

const stats = [
    {
        icon: FileText,
        value: '289',
        label: 'Welfare Schemes Indexed',
        color: 'text-primary',
        bg: 'bg-primary-50',
    },
    {
        icon: MapPin,
        value: '36',
        label: 'States & UTs Covered',
        color: 'text-accent',
        bg: 'bg-accent-50',
    },
    {
        icon: Heart,
        value: '100%',
        label: 'Free for Citizens',
        color: 'text-success',
        bg: 'bg-success-50',
    },
];

export default function StatsBar() {
    return (
        <section className="relative -mt-10 z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg border border-border-light p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center text-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon size={22} className={stat.color} aria-hidden="true" />
                            </div>
                            <div>
                                <p className={`text-3xl sm:text-4xl font-bold ${stat.color} tracking-tight`}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-text-secondary font-medium mt-1">
                                    {stat.label}
                                </p>
                            </div>
                            {/* Divider for mobile */}
                            {index < stats.length - 1 && (
                                <div className="sm:hidden w-12 h-px bg-border-light" aria-hidden="true" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
