import { useQuery } from '@tanstack/react-query';
import { loansApi } from '../../api/loans';
import { formatCurrency } from '../../lib/format';

interface PaymentScheduleProps {
  loanAmount: number;
  loanTerm: number;
  loanType: string;
  creditScore?: number;
}

export function PaymentSchedule({
  loanAmount,
  loanTerm,
  loanType,
  creditScore,
}: PaymentScheduleProps) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['payment-schedule', loanAmount, loanTerm, loanType, creditScore],
    queryFn: () =>
      loansApi.calculateRate({
        loanAmount,
        loanTerm,
        loanType,
        ...(creditScore !== undefined ? { creditScore } : {}),
      }),
  });

  if (isPending) return <p aria-live="polite">Loading repayment schedule…</p>;
  if (isError) {
    return (
      <p role="alert">
        Could not load the repayment schedule.{' '}
        <button type="button" className="link" onClick={() => void refetch()}>
          Try again
        </button>
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <caption>
          Total interest {formatCurrency(data.totalInterest)} over {loanTerm} months
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Payment</th>
            <th scope="col">Principal</th>
            <th scope="col">Interest</th>
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.paymentSchedule.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{formatCurrency(row.payment)}</td>
              <td>{formatCurrency(row.principal)}</td>
              <td>{formatCurrency(row.interest)}</td>
              <td>{formatCurrency(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
