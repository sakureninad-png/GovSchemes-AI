export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

export const INCOME_CATEGORY_OPTIONS = [
    { value: 'BPL', label: 'BPL (Below Poverty Line)' },
    { value: 'APL', label: 'APL (Above Poverty Line)' },
    { value: 'EWS', label: 'EWS (Economically Weaker Section)' },
    { value: 'general', label: 'General' },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'self-employed', label: 'Self-employed' },
    { value: 'salaried', label: 'Salaried' },
    { value: 'farmer', label: 'Farmer' },
    { value: 'student', label: 'Student' },
];

export const CASTE_CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'OBC', label: 'OBC (Other Backward Classes)' },
    { value: 'SC', label: 'SC (Scheduled Caste)' },
    { value: 'ST', label: 'ST (Scheduled Tribe)' },
];

export const EDUCATION_LEVEL_OPTIONS = [
    { value: 'none', label: 'No formal education' },
    { value: 'primary', label: 'Primary (up to class 5)' },
    { value: 'secondary', label: 'Secondary (up to class 12)' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'postgraduate', label: 'Post-graduate' },
];

export const RATION_CARD_TYPE_OPTIONS = [
    { value: 'yellow', label: 'Yellow (BPL)' },
    { value: 'saffron', label: 'Saffron (APL)' },
    { value: 'white', label: 'White' },
    { value: 'pink', label: 'Pink' },
    { value: 'AAY', label: 'AAY (Antyodaya Anna Yojana)' },
];
