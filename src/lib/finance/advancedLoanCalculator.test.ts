import { describe, expect, it } from 'vitest';
import type { LoanInput } from '../../types/loan';
import { calculateAdvancedLoan } from './advancedLoanCalculator';

const input: LoanInput = {
  loanAmount: 120_000,
  annualInterestRate: 6,
  termYears: 10,
  monthlyNetIncome: 10_000,
  monthlyObligations: 1_000,
};

describe('calculateAdvancedLoan', () => {
  it('wylicza raty malejące z malejącą częścią odsetkową', () => {
    const result = calculateAdvancedLoan(input, { variant: 'declining' });

    expect(result.schedule).toHaveLength(120);
    expect(result.initialInstallment).toBeGreaterThan(
      result.schedule.at(-1)?.installmentAmount ?? 0,
    );
    expect(result.schedule[1]?.interestAmount).toBeLessThan(
      result.schedule[0]?.interestAmount ?? Infinity,
    );
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it('skraca okres po nadpłacie jednorazowej i cyklicznej', () => {
    const withoutPrepayments = calculateAdvancedLoan(input, { variant: 'annuity' });
    const withPrepayments = calculateAdvancedLoan(input, {
      variant: 'annuity',
      prepaymentPlan: { oneTimeInstallment: 6, oneTimeAmount: 10_000, recurringAmount: 200 },
    });

    expect(withPrepayments.actualTermMonths).toBeLessThan(withoutPrepayments.actualTermMonths);
    expect(withPrepayments.totalInterestAmount).toBeLessThan(
      withoutPrepayments.totalInterestAmount,
    );
    expect(withPrepayments.prepaymentTotal).toBeGreaterThan(10_000);
    expect(withPrepayments.schedule.at(-1)?.remainingBalance).toBe(0);
  });
});
