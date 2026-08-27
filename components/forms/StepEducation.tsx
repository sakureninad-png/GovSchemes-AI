'use client';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { OnboardingFormData } from '@/lib/types';
import { EDUCATION_LEVEL_OPTIONS, RATION_CARD_TYPE_OPTIONS } from '@/lib/constants';

interface StepEducationProps {
    formData: OnboardingFormData;
    errors: Record<string, string>;
    onChange: (field: keyof OnboardingFormData, value: string | number | boolean) => void;
}

export default function StepEducation({
    formData,
    errors,
    onChange,
}: StepEducationProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text">Education & Family</h2>
                <p className="text-text-secondary mt-1">
                    Final step — this helps match education and family-based schemes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                    label="Education Level"
                    options={EDUCATION_LEVEL_OPTIONS}
                    value={formData.educationLevel}
                    onChange={(e) => onChange('educationLevel', e.target.value)}
                    error={errors.educationLevel}
                    required
                />

                <Input
                    label="Family Size"
                    type="number"
                    placeholder="Number of family members"
                    min={1}
                    max={20}
                    value={formData.familySize || ''}
                    onChange={(e) => onChange('familySize', parseInt(e.target.value) || 0)}
                    error={errors.familySize}
                    helperText="Including yourself"
                />
            </div>

            {/* Ration Card Toggle */}
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => onChange('hasRationCard', !formData.hasRationCard)}
                    className={`
            flex items-center gap-3 w-full p-4 rounded-xl border-2
            text-left transition-all duration-200 cursor-pointer
            ${formData.hasRationCard
                            ? 'border-primary bg-primary-50 shadow-sm'
                            : 'border-border hover:border-primary-200 hover:bg-bg-secondary'
                        }
          `}
                    aria-pressed={formData.hasRationCard}
                >
                    {/* Toggle switch */}
                    <div
                        className={`
              relative w-11 h-6 rounded-full shrink-0
              transition-colors duration-200
              ${formData.hasRationCard ? 'bg-primary' : 'bg-border'}
            `}
                        aria-hidden="true"
                    >
                        <div
                            className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md
                transition-transform duration-200
                ${formData.hasRationCard ? 'translate-x-[22px]' : 'translate-x-0.5'}
              `}
                        />
                    </div>

                    <div>
                        <p className={`text-sm font-medium ${formData.hasRationCard ? 'text-primary-dark' : 'text-text'}`}>
                            I have a Ration Card
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                            A ration card can unlock additional food security and subsidy schemes
                        </p>
                    </div>
                </button>

                {/* Ration Card Type (conditional) */}
                {formData.hasRationCard && (
                    <div className="pl-4 border-l-2 border-primary-200 animate-fadeIn">
                        <Select
                            label="Ration Card Type"
                            options={RATION_CARD_TYPE_OPTIONS}
                            value={formData.rationCardType || ''}
                            onChange={(e) => onChange('rationCardType', e.target.value)}
                            error={errors.rationCardType}
                            required
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
