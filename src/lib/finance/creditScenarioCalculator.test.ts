import { describe, expect, it } from 'vitest';
import type { CreditScenarioInput } from '../../types/creditScenario';
import { basicLoanInputToScenarioV2 } from './basicLoanInputToScenarioV2';
import { calculateCreditScenario } from './creditScenarioCalculator';

function baseScenario(overrides: Partial<CreditScenarioInput> = {}): CreditScenarioInput {
  return {
    budget: {
      monthlyDebtObligations: 1_000,
      monthlyEssentialCosts: 4_000,
      monthlyNetIncome: 10_000,
    },
    costs: [],
    currency: 'PLN',
    dayCountConvention: 'monthly-12',
    disbursements: [{ amount: 120_000, date: '2026-01-01' }],
    firstInstallmentDate: '2026-02-01',
    installmentCount: 12,
    prepayments: [],
    rateKind: 'fixed',
    ratePeriods: [{ annualNominalRate: 6, startsOn: '2026-01-01' }],
    repaymentVariant: 'annuity',
    totalCreditAmount: 120_000,
    version: 2,
    ...overrides,
  };
}

describe('calculateCreditScenario', () => {
  it('zachowuje wynik basic-v1 dla rat równych bez kosztów', () => {
    const result = calculateCreditScenario(
      basicLoanInputToScenarioV2({
        annualInterestRate: 6,
        loanAmount: 120_000,
        monthlyNetIncome: 10_000,
        monthlyObligations: 1_000,
        termYears: 1,
      }),
    );

    expect(result.initialInstallment).toBe(10_327.97);
    expect(result.totalAmountPayable).toBe(123_935.66);
    expect(result.totalInterestAmount).toBe(3_935.66);
    expect(result.totalCreditCost).toBe(3_935.66);
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it('uwzględnia prowizję pobraną z góry w koszcie i RRSO', () => {
    const noFee = calculateCreditScenario(baseScenario({
      disbursements: [{ amount: 1_200, date: '2026-01-01' }],
      totalCreditAmount: 1_200,
      ratePeriods: [{ annualNominalRate: 0, startsOn: '2026-01-01' }],
    }));
    const withFee = calculateCreditScenario(baseScenario({
      costs: [{
        amount: 120,
        funding: 'paid-by-consumer',
        id: 'commission',
        name: 'Prowizja',
        required: true,
        timing: 'upfront',
      }],
      disbursements: [{ amount: 1_200, date: '2026-01-01' }],
      totalCreditAmount: 1_200,
      ratePeriods: [{ annualNominalRate: 0, startsOn: '2026-01-01' }],
    }));

    expect(noFee.apr.annualPercentageRate).toBeCloseTo(0, 6);
    expect(withFee.totalCreditCost).toBe(120);
    expect(withFee.apr.annualPercentageRate).toBeGreaterThan(0);
    expect(withFee.apr.npvResidual).not.toBeNull();
    expect(Math.abs(withFee.apr.npvResidual ?? 1)).toBeLessThan(0.0001);
  });

  it('traktuje prowizję finansowaną jako saldo, a nie dodatkową wypłatę', () => {
    const result = calculateCreditScenario(baseScenario({
      costs: [{
        amount: 1_000,
        funding: 'financed',
        id: 'commission',
        name: 'Prowizja finansowana',
        required: true,
        timing: 'with-disbursement',
      }],
    }));

    expect(result.schedule[0]?.startingBalance).toBe(121_000);
    expect(result.totalCreditCost).toBeGreaterThan(1_000);
    expect(result.apr.annualPercentageRate).toBeGreaterThan(6);
  });

  it('skraca okres przy nadpłacie redukującej termin', () => {
    const result = calculateCreditScenario(baseScenario({
      installmentCount: 24,
      prepayments: [{ amount: 30_000, date: '2026-03-01', effect: 'reduce-term' }],
    }));

    expect(result.schedule.length).toBeLessThan(24);
    expect(result.schedule.at(-1)?.remainingBalance).toBe(0);
  });

  it('podaje jawny stres budżetu bez bankowego scoringu', () => {
    const result = calculateCreditScenario(baseScenario({
      budget: {
        annualRateStressBuffer: 2,
        monthlyDebtObligations: 1_000,
        monthlyEssentialCosts: 4_000,
        monthlyNetIncome: 10_000,
      },
    }));

    expect(result.budgetResilience.status).toBe('negative-surplus');
    expect(result.budgetResilience.stressMonthlyPayment).toBeGreaterThan(result.initialInstallment);
  });
});
