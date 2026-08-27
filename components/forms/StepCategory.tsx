'use client';

import Select from '@/components/ui/Select';
import { OnboardingFormData } from '@/lib/types';
import { CASTE_CATEGORY_OPTIONS } from '@/lib/constants';

interface StepCategoryProps {
    formData: OnboardingFormData;
    errors: Record<string, string>;
    onChange: (field: keyof OnboardingFormData, value: string | number | boolean) => void;
}

const specialFlags: { field: keyof OnboardingFormData; label: string; description: string }[] = [
    { field: 'isDisabled', label: 'Person with Disability', description: 'Physical or mental disability (40%+)' },
    { field: 'isWidow', label: 'Widow', description: 'Applies to women who have lost their spouse' },
    { field: 'isStudent', label: 'Student', description: 'Currently enrolled in an educational institution' },
    { field: 'isFarmer', label: 'Farmer', description: 'Engaged in agriculture or allied activities' },
    { field: 'isMinority', label: 'Minority Community', description: 'Belongs to a religious or linguistic minority' },
];

export default function StepCategory({
    formData,
    errors,
    onChange,
}: StepCategoryProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text">Category & Special Status</h2>
                <p className="text-text-secondary mt-1">
                    Select applicable categories — this unlocks additional schemes
                </p>
            </div>

            <Select
                label="Caste Category"
                options={CASTE_CATEGORY_OPTIONS}
                value={formData.casteCategory}
                onChange={(e) => onChange('casteCategory', e.target.value)}
                error={errors.casteCategory}
                required
            />

            {/* Special Flags */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-text">
                    Special Status <span className="text-text-muted font-normal">(select all that apply)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialFlags.map(({ field, label, description }) => (
                        <button
                            key={field}
                            type="button"
                            onClick={() => onChange(field, !formData[field as keyof OnboardingFormData])}
                            className={`
                flex items-start gap-3 p-4 rounded-xl border-2
                text-left transition-all duration-200 cursor-pointer
                ${formData[field as keyof OnboardingFormData]
                                    ? 'border-primary bg-primary-50 shadow-sm'
                                    : 'border-border hover:border-primary-200 hover:bg-bg-secondary'
                                }
              `}
                            aria-pressed={Boolean(formData[field as keyof OnboardingFormData])}
                        >
                            {/* Custom checkbox */}
                            <div
                                className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5
                  transition-all duration-200
                  ${formData[field as keyof OnboardingFormData]
                                        ? 'bg-primary border-primary'
                                        : 'border-border bg-white'
                                    }
                `}
                                aria-hidden="true"
                            >
                                {formData[field as keyof OnboardingFormData] && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>

                            <div>
                                <p className={`text-sm font-medium ${formData[field as keyof OnboardingFormData] ? 'text-primary-dark' : 'text-text'}`}>
                                    {label}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5">{description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Disability percentage (conditional) */}
            {formData.isDisabled && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 animate-fadeIn">
                    <label className="text-sm font-medium text-text block mb-2">
                        Disability Percentage
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g. 40"
                        value={formData.disabilityPercentage || ''}
                        onChange={(e) => onChange('disabilityPercentage', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 text-base bg-white border border-border rounded-lg
              focus:outline-none focus:ring-3 focus:ring-primary/20 focus:border-primary
              transition-all duration-200"
                    />
                    <p className="text-xs text-text-muted mt-1.5">
                        Minimum 40% required for most disability schemes
                    </p>
                </div>
            )}
        </div>
    );
}
