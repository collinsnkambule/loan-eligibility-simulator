import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, type FieldErrors, type UseFormRegisterReturn } from 'react-hook-form';
import type { LoanProduct, ValidationRules } from '../../api/types';
import { Field } from '../../components/Field';
import { titleCase } from '../../lib/format';
import { buildFormSchema, type LoanFormValues } from './schema';

interface LoanFormProps {
  rules: ValidationRules;
  products: LoanProduct[];
  isSubmitting: boolean;
  onSubmit: (values: LoanFormValues) => void;
}

const optionalNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : Number(value);

export function LoanForm({ rules, products, isSubmitting, onSubmit }: LoanFormProps) {
  const purposes = useMemo(
    () => [...new Set(products.flatMap((product) => product.purposes))],
    [products],
  );
  const schema = useMemo(() => buildFormSchema(rules, purposes), [rules, purposes]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employmentStatus: '', loanPurpose: '' },
  });

  const num = (name: keyof LoanFormValues): UseFormRegisterReturn =>
    register(name, { valueAsNumber: true });
  const message = (name: keyof FieldErrors<LoanFormValues>) => errors[name]?.message;

  return (
    <form className="card form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset>
        <legend>About you</legend>
        <Field label="Age" error={message('age')}>
          <input type="number" inputMode="numeric" {...num('age')} />
        </Field>
        <Field label="Employment status" error={message('employmentStatus')}>
          <select {...register('employmentStatus')}>
            <option value="">Select…</option>
            {rules.personalInfo.employmentStatus.options.map((option) => (
              <option key={option} value={option}>
                {titleCase(option)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time in current employment (months)" error={message('employmentDuration')}>
          <input type="number" inputMode="numeric" {...num('employmentDuration')} />
        </Field>
      </fieldset>

      <fieldset>
        <legend>Your finances</legend>
        <Field label="Monthly income (R)" error={message('monthlyIncome')}>
          <input type="number" inputMode="decimal" {...num('monthlyIncome')} />
        </Field>
        <Field label="Monthly expenses (R)" error={message('monthlyExpenses')}>
          <input type="number" inputMode="decimal" {...num('monthlyExpenses')} />
        </Field>
        <Field
          label="Monthly debt repayments (R)"
          hint="Existing loans, credit cards and accounts. Enter 0 if none."
          error={message('existingDebt')}
        >
          <input type="number" inputMode="decimal" {...num('existingDebt')} />
        </Field>
        <Field
          label="Credit score (optional)"
          hint="Between 300 and 850. Leave blank if you don't know it."
          error={message('creditScore')}
        >
          <input
            type="number"
            inputMode="numeric"
            {...register('creditScore', { setValueAs: optionalNumber })}
          />
        </Field>
      </fieldset>

      <fieldset>
        <legend>The loan</legend>
        <Field label="Loan amount (R)" error={message('requestedAmount')}>
          <input type="number" inputMode="decimal" {...num('requestedAmount')} />
        </Field>
        <Field label="Loan term (months)" error={message('loanTerm')}>
          <input type="number" inputMode="numeric" {...num('loanTerm')} />
        </Field>
        <Field label="Loan purpose" error={message('loanPurpose')}>
          <select {...register('loanPurpose')}>
            <option value="">Select…</option>
            {purposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {titleCase(purpose)}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? 'Checking…' : 'Check my eligibility'}
      </button>
    </form>
  );
}
