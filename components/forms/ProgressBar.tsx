import { Check } from 'lucide-react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    labels: string[];
}

export default function ProgressBar({
    currentStep,
    totalSteps,
    labels,
}: ProgressBarProps) {
    return (
        <nav aria-label="Form progress" className="w-full">
            <ol className="flex items-center justify-between">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const stepNum = i + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isUpcoming = stepNum > currentStep;

                    return (
                        <li
                            key={stepNum}
                            className="flex-1 flex items-center"
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            <div className="flex flex-col items-center w-full relative">
                                {/* Connector line */}
                                {i > 0 && (
                                    <div
                                        className={`
                      absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2
                      ${isCompleted || isCurrent ? 'bg-primary' : 'border-t-2 border-dashed border-border'}
                    `}
                                        aria-hidden="true"
                                    />
                                )}

                                {/* Step circle */}
                                <div
                                    className={`
                    relative z-10 w-10 h-10 rounded-full
                    flex items-center justify-center
                    text-sm font-bold
                    transition-all duration-300
                    ${isCompleted
                                            ? 'bg-primary text-white shadow-md'
                                            : isCurrent
                                                ? 'bg-primary text-white shadow-lg ring-4 ring-primary-100'
                                                : 'bg-white text-text-muted border-2 border-border'
                                        }
                  `}
                                >
                                    {isCompleted ? (
                                        <Check size={18} strokeWidth={3} aria-hidden="true" />
                                    ) : (
                                        stepNum
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`
                    mt-2 text-xs sm:text-sm text-center leading-tight
                    transition-colors duration-200
                    hidden sm:block
                    ${isCurrent
                                            ? 'font-semibold text-primary'
                                            : isCompleted
                                                ? 'font-medium text-text-secondary'
                                                : 'text-text-muted'
                                        }
                  `}
                                >
                                    {labels[i]}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
