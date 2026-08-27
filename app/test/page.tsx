'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageWrapper from '@/components/layout/PageWrapper';
import { Search, ArrowRight, Shield } from 'lucide-react';

export default function ComponentTestPage() {
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('');

    return (
        <>
            <Navbar />
            <PageWrapper>
                <div className="space-y-16">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-text">
                            GovSchemes AI — Component Library
                        </h1>
                        <p className="text-text-secondary">
                            Phase 1: Design System & UI Primitives
                        </p>
                    </div>

                    {/* Buttons Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Buttons
                        </h2>

                        {/* Variants */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-secondary">Variants</h3>
                            <div className="flex flex-wrap gap-3 items-center">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="danger">Danger</Button>
                            </div>
                        </div>

                        {/* Sizes */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-secondary">Sizes</h3>
                            <div className="flex flex-wrap gap-3 items-center">
                                <Button size="sm">Small</Button>
                                <Button size="md">Medium</Button>
                                <Button size="lg">Large</Button>
                            </div>
                        </div>

                        {/* States */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-text-secondary">States</h3>
                            <div className="flex flex-wrap gap-3 items-center">
                                <Button isLoading>Loading</Button>
                                <Button disabled>Disabled</Button>
                                <Button leftIcon={<Search size={18} />}>With Icon</Button>
                                <Button rightIcon={<ArrowRight size={18} />}>
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Cards Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Cards
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card variant="default">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-text">Default Card</h3>
                                </CardHeader>
                                <CardBody>
                                    <p className="text-text-secondary text-sm">
                                        Subtle shadow with light border. Great for general content.
                                    </p>
                                </CardBody>
                                <CardFooter>
                                    <Button variant="secondary" size="sm">Learn More</Button>
                                </CardFooter>
                            </Card>

                            <Card variant="elevated">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-text">Elevated Card</h3>
                                </CardHeader>
                                <CardBody>
                                    <p className="text-text-secondary text-sm">
                                        Stronger shadow with hover lift effect for featured content.
                                    </p>
                                </CardBody>
                                <CardFooter>
                                    <Button variant="primary" size="sm">Apply Now</Button>
                                </CardFooter>
                            </Card>

                            <Card variant="outlined">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-text">Outlined Card</h3>
                                </CardHeader>
                                <CardBody>
                                    <p className="text-text-secondary text-sm">
                                        Border-only style. Hover changes border to primary color.
                                    </p>
                                </CardBody>
                                <CardFooter>
                                    <Button variant="ghost" size="sm">Details</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </section>

                    {/* Badges Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Badges
                        </h2>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-3 items-center">
                                <Badge variant="default">Scholarship</Badge>
                                <Badge variant="success">Eligible</Badge>
                                <Badge variant="warning">Near Miss</Badge>
                                <Badge variant="danger">Expired</Badge>
                                <Badge variant="info">Central Scheme</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 items-center">
                                <Badge variant="default" size="sm">Small</Badge>
                                <Badge variant="success" size="sm">Small</Badge>
                                <Badge variant="warning" size="sm">Small</Badge>
                                <Badge variant="danger" size="sm">Small</Badge>
                                <Badge variant="info" size="sm">Small</Badge>
                            </div>
                        </div>
                    </section>

                    {/* Inputs Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Form Inputs
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                            <Input
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@example.com"
                                error="Please enter a valid email address"
                            />
                            <Input
                                label="Aadhaar Number"
                                placeholder="XXXX-XXXX-XXXX"
                                helperText="Your 12-digit Aadhaar number"
                            />
                            <Input
                                label="Phone (Disabled)"
                                placeholder="Not available"
                                disabled
                            />
                        </div>
                    </section>

                    {/* Select Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Select Dropdown
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                            <Select
                                label="State"
                                placeholder="Select your state"
                                value={selectValue}
                                onChange={(e) => setSelectValue(e.target.value)}
                                options={[
                                    { value: 'MH', label: 'Maharashtra' },
                                    { value: 'KA', label: 'Karnataka' },
                                    { value: 'DL', label: 'Delhi' },
                                    { value: 'TN', label: 'Tamil Nadu' },
                                    { value: 'UP', label: 'Uttar Pradesh' },
                                ]}
                                required
                            />
                            <Select
                                label="Category"
                                options={[
                                    { value: 'general', label: 'General' },
                                    { value: 'obc', label: 'OBC' },
                                    { value: 'sc', label: 'SC' },
                                    { value: 'st', label: 'ST' },
                                ]}
                                error="Please select a category"
                            />
                        </div>
                    </section>

                    {/* Spinner Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-text border-b border-border pb-2">
                            Spinners
                        </h2>
                        <div className="flex items-center gap-8">
                            <div className="text-center space-y-2">
                                <Spinner size="sm" />
                                <p className="text-xs text-text-muted">Small</p>
                            </div>
                            <div className="text-center space-y-2">
                                <Spinner size="md" />
                                <p className="text-xs text-text-muted">Medium</p>
                            </div>
                            <div className="text-center space-y-2">
                                <Spinner size="lg" />
                                <p className="text-xs text-text-muted">Large</p>
                            </div>
                        </div>
                    </section>
                </div>
            </PageWrapper>
            <Footer />
        </>
    );
}
