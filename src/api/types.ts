export interface EligibilityRequest {
  personalInfo: {
    age: number;
    employmentStatus: string;
    employmentDuration: number;
  };
  financialInfo: {
    monthlyIncome: number;
    monthlyExpenses: number;
    existingDebt: number;
    creditScore?: number;
  };
  loanDetails: {
    requestedAmount: number;
    loanTerm: number;
    loanPurpose: string;
  };
}

export type RiskCategory = 'low' | 'medium' | 'high';
export type AffordabilityScore = 'excellent' | 'good' | 'fair' | 'poor';

export interface EligibilityResponse {
  eligibilityResult: {
    isEligible: boolean;
    approvalLikelihood: number;
    riskCategory: RiskCategory;
    decisionReason: string;
  };
  recommendedLoan: {
    maxAmount: number;
    recommendedAmount: number;
    interestRate: number;
    monthlyPayment: number;
    totalRepayment: number;
  };
  affordabilityAnalysis: {
    disposableIncome: number;
    debtToIncomeRatio: number;
    loanToIncomeRatio: number;
    affordabilityScore: AffordabilityScore;
  };
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRateRange: { min: number; max: number };
  purposes: string[];
}

export interface ProductsResponse {
  products: LoanProduct[];
}

export interface CalculateRateRequest {
  loanAmount: number;
  loanTerm: number;
  creditScore?: number;
  loanType: string;
}

export interface PaymentScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface CalculateRateResponse {
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentScheduleRow[];
}

export interface NumberRule {
  min?: number;
  max?: number;
  required: boolean;
  errorMessage: string;
}

export interface OptionsRule {
  required: boolean;
  options: string[];
  errorMessage: string;
}

export interface ValidationRules {
  personalInfo: {
    age: NumberRule;
    employmentStatus: OptionsRule;
    employmentDuration: NumberRule;
  };
  financialInfo: {
    monthlyIncome: NumberRule;
    monthlyExpenses: NumberRule;
    creditScore: NumberRule;
  };
  loanDetails: {
    requestedAmount: NumberRule;
    loanTerm: NumberRule;
  };
}
