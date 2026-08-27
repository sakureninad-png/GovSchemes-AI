'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/forms/ProgressBar';
import StepBasicInfo from '@/components/forms/StepBasicInfo';
import StepIncome from '@/components/forms/StepIncome';
import StepCategory from '@/components/forms/StepCategory';
import StepEducation from '@/components/forms/StepEducation';
import { useAuth } from '@/lib/auth-context';
import type { OnboardingFormData } from '@/lib/types';

const STEP_LABELS = ['Basic Info', 'Income', 'Category', 'Education'];
const TOTAL_STEPS = 4;

const INITIAL_FORM_DATA: OnboardingFormData = {
    name: '',
    age: 0,
    gender: '' as OnboardingFormData['gender'],
    state: '',
    district: '',
    annualIncome: 0,
    incomeCategory: '' as OnboardingFormData['incomeCategory'],
    employmentType: '' as OnboardingFormData['employmentType'],
    casteCategory: '' as OnboardingFormData['casteCategory'],
    isDisabled: false,
    disabilityPercentage: undefined,
    isWidow: false,
    isStudent: false,
    isFarmer: false,
    isMinority: false,
    educationLevel: '' as OnboardingFormData['educationLevel'],
    familySize: undefined,
    hasRationCard: false,
    rationCardType: undefined,
};

function validateStep(step: number, data: OnboardingFormData): Record<string, string> {
    const errors: Record<string, string> = {};

    switch (step) {
        case 1:
            if (!data.name.trim()) errors.name = 'Full name is required';
            if (!data.age || data.age < 1) errors.age = 'Please enter a valid age';
            if (data.age > 120) errors.age = 'Please enter a valid age';
            if (!data.gender) errors.gender = 'Please select your gender';
            if (!data.state) errors.state = 'Please select your state';
            break;
        case 2:
            if (!data.incomeCategory) errors.incomeCategory = 'Please select income category';
            if (!data.employmentType) errors.employmentType = 'Please select employment type';
            break;
        case 3:
            if (!data.casteCategory) errors.casteCategory = 'Please select your category';
            break;
        case 4:
            if (!data.educationLevel) errors.educationLevel = 'Please select education level';
            if (data.hasRationCard && !data.rationCardType) {
                errors.rationCardType = 'Please select ration card type';
            }
            break;
    }

    return errors;
}

export default function OnboardingPage() {
    const router = useRouter();
    const { userProfile, updateProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
    const formRef = useRef<HTMLDivElement>(null);

    const handleChange = useCallback(
        (field: keyof OnboardingFormData, value: string | number | boolean) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            // Clear error for this field
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        },
        []
    );

    const handleNext = useCallback(() => {
        const stepErrors = validateStep(currentStep, formData);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            // Scroll to first error
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        setErrors({});
        setSlideDirection('right');
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }, [currentStep, formData]);

    const handleBack = useCallback(() => {
        setErrors({});
        setSlideDirection('left');
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    }, []);

    const handleSubmit = useCallback(async () => {
        const stepErrors = validateStep(currentStep, formData);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }

        setIsSubmitting(true);

        // Compute isSeniorCitizen and build full profile
        const profileData = {
            ...(userProfile || {}), // preserve existing fields like email, id
            ...formData,
            isSeniorCitizen: formData.age >= 60,
            needsOnboarding: false,
            updatedAt: new Date().toISOString(),
        };

        try {
            // Persist to localStorage so results page can read it
            localStorage.setItem('userProfile', JSON.stringify(profileData));

            // Sync to email-keyed storage
            const email = (profileData as unknown as Record<string, unknown>).email as string | undefined;
            if (email) {
                localStorage.setItem(`userProfile_${email}`, JSON.stringify(profileData));
            }

            // Update auth context
            updateProfile(profileData as typeof userProfile & typeof formData & { isSeniorCitizen: boolean });

            // Save via API (best-effort)
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });

            if (!res.ok) {
                throw new Error('Failed to save profile');
            }

            router.push('/results');
        } catch {
            // API failed, but localStorage is already set — navigate anyway
            router.push('/results');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentStep, formData, router, userProfile, updateProfile]);

    const renderStep = () => {
        const animClass =
            slideDirection === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft';

        switch (currentStep) {
            case 1:
                return (
                    <div key="step1" className={animClass}>
                        <StepBasicInfo formData={formData} errors={errors} onChange={handleChange} />
                    </div>
                );
            case 2:
                return (
                    <div key="step2" className={animClass}>
                        <StepIncome formData={formData} errors={errors} onChange={handleChange} />
                    </div>
                );
            case 3:
                return (
                    <div key="step3" className={animClass}>
                        <StepCategory formData={formData} errors={errors} onChange={handleChange} />
                    </div>
                );
            case 4:
                return (
                    <div key="step4" className={animClass}>
                        <StepEducation formData={formData} errors={errors} onChange={handleChange} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Navbar />
            <PageWrapper className="flex items-start justify-center py-6 sm:py-10">
                <div className="w-full max-w-3xl" ref={formRef}>
                    {/* Progress Bar */}
                    <div className="mb-8 sm:mb-10">
                        <ProgressBar
                            currentStep={currentStep}
                            totalSteps={TOTAL_STEPS}
                            labels={STEP_LABELS}
                        />
                    </div>

                    {/* Form Card */}
                    <div className="bg-surface rounded-2xl shadow-md border border-border-light p-6 sm:p-8 lg:p-10">
                        {/* Step Content */}
                        {renderStep()}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
                            {currentStep > 1 ? (
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    leftIcon={<ArrowLeft size={18} />}
                                >
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < TOTAL_STEPS ? (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    rightIcon={<ArrowRight size={18} />}
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                    rightIcon={
                                        !isSubmitting ? <CheckCircle2 size={18} /> : undefined
                                    }
                                    size="lg"
                                >
                                    {isSubmitting ? 'Finding Schemes...' : 'Find My Schemes'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Step counter (mobile) */}
                    <p className="text-center text-sm text-text-muted mt-4 sm:hidden">
                        Step {currentStep} of {TOTAL_STEPS}
                    </p>
                </div>
            </PageWrapper>
        </>
    );
}
