import type { EligibilityRequest } from '../api/types';
import { products } from './data';
import { calculateRate, evaluateEligibility, interestRateFor } from './loanEngine';

const baseRequest: EligibilityRequest = {
  personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
  financialInfo: {
    monthlyIncome: 25000,
    monthlyExpenses: 10000,
    existingDebt: 2000,
    creditScore: 700,
  },
  loanDetails: { requestedAmount: 100000, loanTerm: 24, loanPurpose: 'home_improvement' },
};

describe('interestRateFor', () => {
  const personal = products[0]!;

  it('stays within the product range', () => {
    expect(interestRateFor(personal, 300)).toBe(personal.interestRateRange.max);
    expect(interestRateFor(personal, 850)).toBe(personal.interestRateRange.min);
  });

  it('gives better scores lower rates', () => {
    expect(interestRateFor(personal, 780)).toBeLessThan(interestRateFor(personal, 500));
  });
});

describe('evaluateEligibility', () => {
  it('approves an affordable request in full', () => {
    const result = evaluateEligibility(baseRequest);
    expect(result.eligibilityResult.isEligible).toBe(true);
    expect(result.recommendedLoan.recommendedAmount).toBe(100000);
    expect(result.affordabilityAnalysis.disposableIncome).toBe(15000);
  });

  it('declines and reduces the recommended amount when the instalment is too high', () => {
    const result = evaluateEligibility({
      ...baseRequest,
      loanDetails: { ...baseRequest.loanDetails, requestedAmount: 300000 },
    });
    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.recommendedLoan.recommendedAmount).toBeLessThan(300000);
  });

  it('declines unemployed applicants', () => {
    const result = evaluateEligibility({
      ...baseRequest,
      personalInfo: { ...baseRequest.personalInfo, employmentStatus: 'unemployed' },
    });
    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.eligibilityResult.approvalLikelihood).toBeLessThanOrEqual(20);
  });

  it('declines when expenses meet or exceed income', () => {
    const result = evaluateEligibility({
      ...baseRequest,
      financialInfo: { ...baseRequest.financialInfo, monthlyExpenses: 25000 },
    });
    expect(result.eligibilityResult.isEligible).toBe(false);
    expect(result.recommendedLoan.maxAmount).toBe(0);
  });
});

describe('calculateRate', () => {
  it('returns a schedule that sums to the total repayment', () => {
    const result = calculateRate({
      loanAmount: 50000,
      loanTerm: 12,
      loanType: 'personal_loan',
      creditScore: 650,
    });
    const total = result.paymentSchedule.reduce((sum, row) => sum + row.payment, 0);
    expect(result.paymentSchedule).toHaveLength(12);
    expect(result.totalRepayment).toBeCloseTo(total, 1);
    expect(result.totalInterest).toBeCloseTo(result.totalRepayment - 50000, 1);
  });
});
