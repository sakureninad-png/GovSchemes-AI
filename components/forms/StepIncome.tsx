'use client';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { OnboardingFormData } from '@/lib/types';
import { INCOME_CATEGORY_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from '@/lib/constants';

interface StepIncomeProps {
    formData: OnboardingFormData;
    errors: Record<string, string>;
    onChange: (field: keyof OnboardingFormData, value: string | number) => void;
}

function formatIncome(value: number): string {
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
}

export default function StepIncome({
    formData,
    errors,
    onChange,
}: StepIncomeProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text">Income & Employment</h2>
                <p className="text-text-secondary mt-1">
                    This helps determine your eligibility for income-based schemes
                </p>
            </div>

            <div className="space-y-6">
                {/* Income Slider */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-text">
                        Annual Household Income <span className="text-danger" aria-hidden="true">*</span>
                    </label>

                    <div className="bg-primary-50 rounded-xl p-4 sm:p-6">
                        <p className="text-3xl font-bold text-primary text-center mb-4">
                            {formData.annualIncome >= 1000000
                                ? '₹10 Lakh+'
                                : formatIncome(formData.annualIncome)}
                        </p>

                        <input
                            type="range"
                            min={0}
                            max={1000000}
                            step={10000}
                            value={formData.annualIncome}
                            onChange={(e) => onChange('annualIncome', parseInt(e.target.value))}
                            className="w-full h-2 bg-primary-200 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-6
                [&::-moz-range-thumb]:h-6
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:cursor-pointer"
                            aria-label="Annual income slider"
                        />

                        <div className="flex justify-between text-xs text-text-muted mt-2">
                            <span>₹0</span>
                            <span>₹5 Lakh</span>
                            <span>₹10 Lakh+</span>
                        </div>
                    </div>

                    {/* Manual input */}
                    <Input
                        label="Or enter exact amount (₹)"
                        type="number"
                        placeholder="e.g. 250000"
                        min={0}
                        value={formData.annualIncome === 0 ? '' : formData.annualIncome}
                        onChange={(e) => onChange('annualIncome', parseInt(e.target.value) || 0)}
                        error={errors.annualIncome}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select
                        label="Income Category"
                        options={INCOME_CATEGORY_OPTIONS}
                        value={formData.incomeCategory}
                        onChange={(e) => onChange('incomeCategory', e.target.value)}
                        error={errors.incomeCategory}
                        helperText="Select the category that applies to your household"
                        required
                    />

                    <Select
                        label="Employment Type"
                        options={EMPLOYMENT_TYPE_OPTIONS}
                        value={formData.employmentType}
                        onChange={(e) => onChange('employmentType', e.target.value)}
                        error={errors.employmentType}
                        required
                    />
                </div>
            </div>
        </div>
    );
}
