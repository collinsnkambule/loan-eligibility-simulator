import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { loansApi } from '../../api/loans';
import type { LoanProduct } from '../../api/types';
import { LoanForm } from './LoanForm';
import { ResultPanel } from './ResultPanel';
import { toEligibilityRequest, type LoanFormValues } from './schema';

const loanTypeFor = (products: LoanProduct[], purpose: string): string =>
  products.find((product) => product.purposes.includes(purpose))?.id ?? 'personal_loan';

export function LoanSimulatorPage() {
  const [submitted, setSubmitted] = useState<LoanFormValues | null>(null);

  const rulesQuery = useQuery({
    queryKey: ['validation-rules'],
    queryFn: loansApi.getValidationRules,
    staleTime: Infinity,
  });
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: loansApi.getProducts,
    staleTime: Infinity,
  });
  const eligibility = useMutation({
    mutationFn: (values: LoanFormValues) => loansApi.checkEligibility(toEligibilityRequest(values)),
  });

  if (rulesQuery.isPending || productsQuery.isPending) {
    return <p aria-live="polite">Loading the simulator…</p>;
  }

  if (rulesQuery.isError || productsQuery.isError) {
    return (
      <div role="alert" className="card">
        <p>We couldn&apos;t load the simulator. Please try again.</p>
        <button
          type="button"
          className="button"
          onClick={() => {
            void rulesQuery.refetch();
            void productsQuery.refetch();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const products = productsQuery.data.products;

  return (
    <div className="layout">
      <LoanForm
        rules={rulesQuery.data}
        products={products}
        isSubmitting={eligibility.isPending}
        onSubmit={(values) => {
          setSubmitted(values);
          eligibility.mutate(values);
        }}
      />

      <div>
        {eligibility.isError && (
          <p role="alert" className="card">
            {eligibility.error.message}
          </p>
        )}
        {eligibility.data && submitted && (
          <ResultPanel
            result={eligibility.data}
            loanTerm={submitted.loanTerm}
            loanType={loanTypeFor(products, submitted.loanPurpose)}
            {...(submitted.creditScore !== undefined ? { creditScore: submitted.creditScore } : {})}
          />
        )}
        {!eligibility.data && !eligibility.isError && (
          <p className="card placeholder">
            Fill in your details and select &ldquo;Check my eligibility&rdquo; to see your estimate.
          </p>
        )}
      </div>
    </div>
  );
}
