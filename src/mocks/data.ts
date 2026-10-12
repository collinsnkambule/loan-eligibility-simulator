import type { LoanProduct, ValidationRules } from '../api/types';

export const products: LoanProduct[] = [
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    description: 'Flexible personal financing for various needs',
    minAmount: 5000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 60,
    interestRateRange: { min: 10.5, max: 18.5 },
    purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
  },
  {
    id: 'vehicle_loan',
    name: 'Vehicle Finance',
    description: 'Financing for new and used vehicles',
    minAmount: 50000,
    maxAmount: 1500000,
    minTerm: 12,
    maxTerm: 72,
    interestRateRange: { min: 8.5, max: 15 },
    purposes: ['new_vehicle', 'used_vehicle'],
  },
];

export const validationRules: ValidationRules = {
  personalInfo: {
    age: { min: 18, max: 65, required: true, errorMessage: 'Age must be between 18 and 65' },
    employmentStatus: {
      required: true,
      options: ['employed', 'self_employed', 'unemployed', 'retired'],
      errorMessage: 'Please select your employment status',
    },
    employmentDuration: {
      min: 3,
      required: true,
      errorMessage: 'Minimum 3 months employment required',
    },
  },
  financialInfo: {
    monthlyIncome: {
      min: 5000,
      required: true,
      errorMessage: 'Minimum monthly income of R5,000 required',
    },
    monthlyExpenses: {
      min: 0,
      required: true,
      errorMessage: 'Please enter your monthly expenses',
    },
    creditScore: {
      min: 300,
      max: 850,
      required: false,
      errorMessage: 'Credit score must be between 300 and 850',
    },
  },
  loanDetails: {
    requestedAmount: {
      min: 5000,
      max: 300000,
      required: true,
      errorMessage: 'Loan amount must be between R5,000 and R300,000',
    },
    loanTerm: {
      min: 6,
      max: 60,
      required: true,
      errorMessage: 'Loan term must be between 6 and 60 months',
    },
  },
};

export function productForPurpose(purpose: string): LoanProduct {
  const product = products.find((p) => p.purposes.includes(purpose));
  // Unknown purposes fall back to the general-purpose product.
  return product ?? (products[0] as LoanProduct);
}

export function productById(id: string): LoanProduct | undefined {
  return products.find((p) => p.id === id);
}
