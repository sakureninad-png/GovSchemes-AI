import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { OnboardingFormData } from '@/lib/types';
import { INDIAN_STATES, GENDER_OPTIONS } from '@/lib/constants';

interface StepBasicInfoProps {
    formData: OnboardingFormData;
    errors: Record<string, string>;
    onChange: (field: keyof OnboardingFormData, value: string | number) => void;
}

export default function StepBasicInfo({
    formData,
    errors,
    onChange,
}: StepBasicInfoProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text">Tell us about yourself</h2>
                <p className="text-text-secondary mt-1">
                    We&apos;ll use this to match you with relevant schemes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    error={errors.name}
                    required
                />

                <Input
                    label="Age"
                    type="number"
                    placeholder="Enter your age"
                    min={0}
                    max={120}
                    value={formData.age === 0 ? '' : formData.age}
                    onChange={(e) => onChange('age', parseInt(e.target.value) || 0)}
                    error={errors.age}
                    required
                />

                <Select
                    label="Gender"
                    options={GENDER_OPTIONS}
                    value={formData.gender}
                    onChange={(e) => onChange('gender', e.target.value)}
                    error={errors.gender}
                    required
                />

                <Select
                    label="State"
                    options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                    placeholder="Select your state"
                    value={formData.state}
                    onChange={(e) => onChange('state', e.target.value)}
                    error={errors.state}
                    required
                />

                <Input
                    label="District"
                    placeholder="Enter your district (optional)"
                    value={formData.district || ''}
                    onChange={(e) => onChange('district', e.target.value)}
                    helperText="Optional — helps find state-specific schemes"
                />
            </div>
        </div>
    );
}
