import { buildSchedule, maxPrincipal, monthlyPayment } from './loanMath';

describe('monthlyPayment', () => {
  it('matches the standard annuity formula', () => {
    expect(monthlyPayment(100000, 12, 12)).toBeCloseTo(8884.88, 2);
  });

  it('divides evenly when the rate is zero', () => {
    expect(monthlyPayment(12000, 0, 12)).toBe(1000);
  });
});

describe('maxPrincipal', () => {
  it('is the inverse of monthlyPayment', () => {
    const payment = monthlyPayment(150000, 12.5, 24);
    expect(maxPrincipal(payment, 12.5, 24)).toBeCloseTo(150000, 4);
  });
});

describe('buildSchedule', () => {
  const schedule = buildSchedule(150000, 12.5, 24);

  it('has one row per month', () => {
    expect(schedule).toHaveLength(24);
    expect(schedule[0]?.month).toBe(1);
  });

  it('repays the principal exactly and ends at a zero balance', () => {
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(totalPrincipal).toBeCloseTo(150000, 1);
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it('charges interest on the opening balance in month one', () => {
    expect(schedule[0]?.interest).toBeCloseTo(150000 * (0.125 / 12), 2);
  });
});
