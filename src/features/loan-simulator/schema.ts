import { z } from 'zod';
import type { EligibilityRequest, NumberRule, ValidationRules } from '../../api/types';

export interface LoanFormValues {
  age: number;
  employmentStatus: string;
  employmentDuration: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebt: number;
  creditScore?: number;
  requestedAmount: number;
  loanTerm: number;
  loanPurpose: string;
}

function numberField(rule: NumberRule) {
  let schema = z.number({
    required_error: rule.errorMessage,
    invalid_type_error: rule.errorMessage,
  });
  if (rule.min !== undefined) schema = schema.min(rule.min, rule.errorMessage);
  if (rule.max !== undefined) schema = schema.max(rule.max, rule.errorMessage);
  return schema;
}

/** Builds the form schema from the rules served by `GET /api/loans/validation-rules`. */
export function buildFormSchema(rules: ValidationRules, purposes: string[]) {
  const { personalInfo, financialInfo, loanDetails } = rules;
  const [firstStatus, ...otherStatuses] = personalInfo.employmentStatus.options;

  return z.object({
    age: numberField(personalInfo.age).int('Age must be a whole number'),
    employmentStatus: z.enum([firstStatus ?? 'employed', ...otherStatuses], {
      errorMap: () => ({ message: personalInfo.employmentStatus.errorMessage }),
    }),
    employmentDuration: numberField(personalInfo.employmentDuration),
    monthlyIncome: numberField(financialInfo.monthlyIncome),
    monthlyExpenses: numberField(financialInfo.monthlyExpenses),
    existingDebt: z
      .number({
        required_error: 'Enter your monthly debt repayments (0 if none)',
        invalid_type_error: 'Enter your monthly debt repayments (0 if none)',
      })
      .min(0, 'Debt repayments cannot be negative'),
    creditScore: numberField({ ...financialInfo.creditScore, required: false }).optional(),
    requestedAmount: numberField(loanDetails.requestedAmount),
    loanTerm: numberField(loanDetails.loanTerm).int('Loan term must be a whole number of months'),
    loanPurpose: z.string().refine((value) => purposes.includes(value), {
      message: 'Please select a loan purpose',
    }),
  }) satisfies z.ZodType<LoanFormValues, z.ZodTypeDef, unknown>;
}

export function toEligibilityRequest(values: LoanFormValues): EligibilityRequest {
  return {
    personalInfo: {
      age: values.age,
      employmentStatus: values.employmentStatus,
      employmentDuration: values.employmentDuration,
    },
    financialInfo: {
      monthlyIncome: values.monthlyIncome,
      monthlyExpenses: values.monthlyExpenses,
      existingDebt: values.existingDebt,
      ...(values.creditScore !== undefined ? { creditScore: values.creditScore } : {}),
    },
    loanDetails: {
      requestedAmount: values.requestedAmount,
      loanTerm: values.loanTerm,
      loanPurpose: values.loanPurpose,
    },
  };
}
