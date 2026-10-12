import type {
  AffordabilityScore,
  CalculateRateRequest,
  CalculateRateResponse,
  EligibilityRequest,
  EligibilityResponse,
  LoanProduct,
  RiskCategory,
} from '../api/types';
import { buildSchedule, maxPrincipal, monthlyPayment, round2 } from '../lib/loanMath';
import { productById, productForPurpose } from './data';

/** Share of disposable income a loan instalment may consume. */
const MAX_PAYMENT_SHARE = 0.7;
const DEFAULT_CREDIT_SCORE = 600;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Better credit score => lower rate, interpolated across the product's range. */
export function interestRateFor(product: LoanProduct, creditScore?: number): number {
  const score = clamp(creditScore ?? DEFAULT_CREDIT_SCORE, 300, 850);
  const { min, max } = product.interestRateRange;
  const position = (score - 300) / (850 - 300);
  return round2(max - position * (max - min));
}

function riskFor(likelihood: number): RiskCategory {
  if (likelihood >= 75) return 'low';
  if (likelihood >= 50) return 'medium';
  return 'high';
}

function affordabilityFor(paymentShare: number): AffordabilityScore {
  if (paymentShare <= 0.3) return 'excellent';
  if (paymentShare <= 0.5) return 'good';
  if (paymentShare <= MAX_PAYMENT_SHARE) return 'fair';
  return 'poor';
}

export function evaluateEligibility(req: EligibilityRequest): EligibilityResponse {
  const { personalInfo, financialInfo, loanDetails } = req;
  const product = productForPurpose(loanDetails.loanPurpose);
  const rate = interestRateFor(product, financialInfo.creditScore);

  const amount = clamp(loanDetails.requestedAmount, product.minAmount, product.maxAmount);
  const term = clamp(loanDetails.loanTerm, product.minTerm, product.maxTerm);

  const disposableIncome = financialInfo.monthlyIncome - financialInfo.monthlyExpenses;
  // `existingDebt` is the customer's monthly debt repayments.
  const debtToIncomeRatio = (financialInfo.existingDebt / financialInfo.monthlyIncome) * 100;
  // Annual basis: requested amount relative to a year of income.
  const loanToIncomeRatio = (amount / (financialInfo.monthlyIncome * 12)) * 100;

  const requestedPayment = monthlyPayment(amount, rate, term);
  const availableForLoan = Math.max(disposableIncome - financialInfo.existingDebt, 0);
  const paymentShare = disposableIncome > 0 ? requestedPayment / disposableIncome : Infinity;

  const maxAmount = Math.min(
    Math.max(Math.floor(maxPrincipal(availableForLoan * MAX_PAYMENT_SHARE, rate, term)), 0),
    product.maxAmount,
  );
  const recommendedAmount = Math.min(amount, maxAmount);
  const recommendedPayment = monthlyPayment(recommendedAmount, rate, term);

  let likelihood = 100;
  likelihood -= clamp(paymentShare, 0, 2) * 40;
  likelihood -= clamp(debtToIncomeRatio, 0, 100) * 0.5;
  likelihood -= (850 - (financialInfo.creditScore ?? DEFAULT_CREDIT_SCORE)) / 18;
  likelihood -= personalInfo.employmentDuration < 12 ? 10 : 0;
  likelihood = Math.round(clamp(likelihood, 0, 100));

  let isEligible = likelihood >= 50 && requestedPayment <= availableForLoan * MAX_PAYMENT_SHARE;
  let decisionReason = isEligible
    ? 'Strong income-to-expense ratio and manageable existing debt'
    : 'The requested instalment is too high relative to your disposable income and existing debt';

  if (personalInfo.employmentStatus === 'unemployed') {
    isEligible = false;
    likelihood = Math.min(likelihood, 20);
    decisionReason = 'A regular source of income is required to qualify for credit';
  } else if (disposableIncome <= 0) {
    isEligible = false;
    decisionReason = 'Your monthly expenses are equal to or higher than your income';
  }

  const effectivePayment = isEligible ? requestedPayment : recommendedPayment;
  const effectiveAmount = isEligible ? amount : recommendedAmount;

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood: likelihood,
      riskCategory: riskFor(likelihood),
      decisionReason,
    },
    recommendedLoan: {
      maxAmount,
      recommendedAmount: effectiveAmount,
      interestRate: rate,
      monthlyPayment: round2(effectivePayment),
      totalRepayment: round2(effectivePayment * term),
    },
    affordabilityAnalysis: {
      disposableIncome: round2(disposableIncome),
      debtToIncomeRatio: round2(debtToIncomeRatio),
      loanToIncomeRatio: round2(loanToIncomeRatio),
      affordabilityScore: affordabilityFor(paymentShare),
    },
  };
}

export function calculateRate(req: CalculateRateRequest): CalculateRateResponse {
  const product = productById(req.loanType) ?? productForPurpose('other');
  const rate = interestRateFor(product, req.creditScore);
  const payment = monthlyPayment(req.loanAmount, rate, req.loanTerm);
  const schedule = buildSchedule(req.loanAmount, rate, req.loanTerm);
  const totalRepayment = schedule.reduce((sum, row) => sum + row.payment, 0);

  return {
    interestRate: rate,
    monthlyPayment: round2(payment),
    totalInterest: round2(totalRepayment - req.loanAmount),
    totalRepayment: round2(totalRepayment),
    paymentSchedule: schedule,
  };
}
