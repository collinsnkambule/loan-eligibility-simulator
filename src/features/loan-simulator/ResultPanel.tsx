import { useState } from 'react';
import type { EligibilityResponse } from '../../api/types';
import { formatCurrency, formatPercent, titleCase } from '../../lib/format';
import { PaymentSchedule } from './PaymentSchedule';

interface ResultPanelProps {
  result: EligibilityResponse;
  loanTerm: number;
  loanType: string;
  creditScore?: number;
}

export function ResultPanel({ result, loanTerm, loanType, creditScore }: ResultPanelProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const { eligibilityResult, recommendedLoan, affordabilityAnalysis } = result;
  const canShowSchedule = recommendedLoan.recommendedAmount > 0;

  return (
    <section className="card result" aria-labelledby="result-heading" aria-live="polite">
      <h2 id="result-heading">Your estimate</h2>

      <p className={`badge badge--${eligibilityResult.isEligible ? 'good' : 'bad'}`}>
        {eligibilityResult.isEligible ? 'Likely to qualify' : 'Unlikely to qualify as requested'}
      </p>
      <p>{eligibilityResult.decisionReason}</p>

      <dl>
        <div>
          <dt>Approval likelihood</dt>
          <dd>{eligibilityResult.approvalLikelihood}%</dd>
        </div>
        <div>
          <dt>Risk category</dt>
          <dd>{titleCase(eligibilityResult.riskCategory)}</dd>
        </div>
        <div>
          <dt>Recommended amount</dt>
          <dd>{formatCurrency(recommendedLoan.recommendedAmount)}</dd>
        </div>
        <div>
          <dt>Maximum you could afford</dt>
          <dd>{formatCurrency(recommendedLoan.maxAmount)}</dd>
        </div>
        <div>
          <dt>Interest rate</dt>
          <dd>{formatPercent(recommendedLoan.interestRate)} p.a.</dd>
        </div>
        <div>
          <dt>Monthly payment</dt>
          <dd>{formatCurrency(recommendedLoan.monthlyPayment)}</dd>
        </div>
        <div>
          <dt>Total repayment</dt>
          <dd>{formatCurrency(recommendedLoan.totalRepayment)}</dd>
        </div>
      </dl>

      <h3>Affordability</h3>
      <dl>
        <div>
          <dt>Disposable income</dt>
          <dd>{formatCurrency(affordabilityAnalysis.disposableIncome)}</dd>
        </div>
        <div>
          <dt>Debt-to-income</dt>
          <dd>{formatPercent(affordabilityAnalysis.debtToIncomeRatio)}</dd>
        </div>
        <div>
          <dt>Loan-to-annual-income</dt>
          <dd>{formatPercent(affordabilityAnalysis.loanToIncomeRatio)}</dd>
        </div>
        <div>
          <dt>Affordability</dt>
          <dd>{titleCase(affordabilityAnalysis.affordabilityScore)}</dd>
        </div>
      </dl>

      {canShowSchedule && (
        <>
          <button
            type="button"
            className="button button--secondary"
            aria-expanded={showSchedule}
            onClick={() => setShowSchedule((open) => !open)}
          >
            {showSchedule ? 'Hide repayment schedule' : 'View repayment schedule'}
          </button>
          {showSchedule && (
            <PaymentSchedule
              loanAmount={recommendedLoan.recommendedAmount}
              loanTerm={loanTerm}
              loanType={loanType}
              {...(creditScore !== undefined ? { creditScore } : {})}
            />
          )}
        </>
      )}

      <p className="disclaimer">
        This is an estimate based on mocked data and is not a credit offer.
      </p>
    </section>
  );
}
