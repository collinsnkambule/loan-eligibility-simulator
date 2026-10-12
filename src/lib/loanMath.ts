import type { PaymentScheduleRow } from '../api/types';

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Standard annuity payment. `annualRatePct` is a percentage, e.g. 12.5. */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Inverse of `monthlyPayment`: the largest principal a given payment can service. */
export function maxPrincipal(payment: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export function buildSchedule(
  principal: number,
  annualRatePct: number,
  months: number,
): PaymentScheduleRow[] {
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, months);
  const rows: PaymentScheduleRow[] = [];
  let balance = principal;

  for (let month = 1; month <= months; month++) {
    const interest = balance * r;
    // The final instalment clears the balance exactly, absorbing rounding drift.
    const principalPart = month === months ? balance : payment - interest;
    balance = month === months ? 0 : balance - principalPart;
    rows.push({
      month,
      payment: round2(principalPart + interest),
      principal: round2(principalPart),
      interest: round2(interest),
      balance: round2(Math.max(balance, 0)),
    });
  }
  return rows;
}
