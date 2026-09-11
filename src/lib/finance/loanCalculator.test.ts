import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import type { LoanCalculationResult, LoanInput, RepaymentScheduleItem } from '../../types/loan';
import { calculateLoan } from './loanCalculator';

const MONEY_DECIMAL_PLACES = 2;

const typicalInput: LoanInput = {
  loanAmount: 120_000,
  annualInterestRate: 6,
  termYears: 1,
  monthlyNetIncome: 10_000,
  monthlyObligations: 1_000,
};

function toDecimal(value: number) {
  return new Decimal(value.toString());
}

function roundMoney(value: number) {
  return toDecimal(value).toDecimalPlaces(MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

function sumScheduleMoney(
  schedule: RepaymentScheduleItem[],
  field: 'installmentAmount' | 'principalAmount' | 'interestAmount',
) {
  return schedule.reduce((total, item) => total.plus(toDecimal(item[field])), new Decimal(0));
}

function expectMoneyEqual(actual: number | Decimal, expected: number | Decimal) {
  expect(new Decimal(actual).equals(new Decimal(expected))).toBe(true);
}

function expectScheduleIntegrity(input: LoanInput, result: LoanCalculationResult) {
  expect(result.schedule).toHaveLength(input.termYears * 12);

  const numericResultValues = [
    result.monthlyInstallment,
    result.totalRepaymentAmount,
    result.totalCreditCost,
    result.totalInterestAmount,
    result.debtBurdenRatio,
  ];

  numericResultValues.forEach((value) => {
    expect(Number.isFinite(value)).toBe(true);
    expect(Object.is(value, -0)).toBe(false);
  });

  const normalizedLoanAmount = roundMoney(input.loanAmount);
  let previousBalance = normalizedLoanAmount;
  let previousInterest: Decimal | undefined;

  result.schedule.forEach((item, index) => {
    expect(item.installmentNumber).toBe(index + 1);

    const installmentAmount = toDecimal(item.installmentAmount);
    const principalAmount = toDecimal(item.principalAmount);
    const interestAmount = toDecimal(item.interestAmount);
    const remainingBalance = toDecimal(item.remainingBalance);

    [installmentAmount, principalAmount, interestAmount, remainingBalance].forEach((value) => {
      expect(value.decimalPlaces()).toBeLessThanOrEqual(MONEY_DECIMAL_PLACES);
    });
    [
      item.installmentAmount,
      item.principalAmount,
      item.interestAmount,
      item.remainingBalance,
    ].forEach((value) => {
      expect(Number.isFinite(value)).toBe(true);
      expect(Object.is(value, -0)).toBe(false);
    });

    expect(installmentAmount.equals(principalAmount.plus(interestAmount))).toBe(true);
    expect(remainingBalance.isNegative()).toBe(false);
    expect(remainingBalance.lessThanOrEqualTo(previousBalance)).toBe(true);

    if (input.annualInterestRate > 0 && previousInterest !== undefined) {
      expect(interestAmount.lessThanOrEqualTo(previousInterest)).toBe(true);
    }

    previousBalance = remainingBalance;
    previousInterest = interestAmount;
  });

  expectMoneyEqual(result.schedule.at(-1)?.remainingBalance ?? NaN, 0);
  expectMoneyEqual(sumScheduleMoney(result.schedule, 'principalAmount'), normalizedLoanAmount);
  expectMoneyEqual(sumScheduleMoney(result.schedule, 'interestAmount'), result.totalInterestAmount);
  expectMoneyEqual(
    sumScheduleMoney(result.schedule, 'installmentAmount'),
    result.totalRepaymentAmount,
  );
  expectMoneyEqual(result.totalCreditCost, result.totalInterestAmount);
}

describe('calculateLoan', () => {
  it('zwraca niezależnie zweryfikowane wartości dla typowego kredytu', () => {
    const result = calculateLoan(typicalInput);

    expect(result.monthlyInstallment).toBe(10_327.97);
    expect(result.totalRepaymentAmount).toBe(123_935.66);
    expect(result.totalCreditCost).toBe(3_935.66);
    expect(result.totalInterestAmount).toBe(3_935.66);
    expect(result.debtBurdenRatio).toBe(113.28);
    expect(result.schedule[0]).toMatchObject({
      installmentAmount: 10_327.97,
      principalAmount: 9_727.97,
      interestAmount: 600,
      remainingBalance: 110_272.03,
    });
    expect(result.schedule.at(-1)).toMatchObject({
      installmentAmount: 10_327.99,
      principalAmount: 10_276.61,
      interestAmount: 51.38,
      remainingBalance: 0,
    });
    expectScheduleIntegrity(typicalInput, result);
  });

  it('obsługuje najkrótszy dostępny okres i kredyt z oprocentowaniem 0%', () => {
    const input: LoanInput = {
      ...typicalInput,
      loanAmount: 1_200,
      annualInterestRate: 0,
      monthlyObligations: 0,
    };
    const result = calculateLoan(input);

    expect(result.monthlyInstallment).toBe(100);
    expect(result.totalRepaymentAmount).toBe(1_200);
    expect(result.totalCreditCost).toBe(0);
    expect(result.totalInterestAmount).toBe(0);
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule.every((item) => item.interestAmount === 0)).toBe(true);
    expectScheduleIntegrity(input, result);
  });

  it('normalizuje ułamki grosza metodą ROUND_HALF_UP i wyrównuje ostatnią ratę', () => {
    const input: LoanInput = {
      loanAmount: 1_000.005,
      annualInterestRate: 0,
      termYears: 1,
      monthlyNetIncome: 1_000.005,
      monthlyObligations: 0.005,
    };
    const result = calculateLoan(input);

    expect(result.monthlyInstallment).toBe(83.33);
    expect(result.totalRepaymentAmount).toBe(1_000.01);
    expect(result.totalCreditCost).toBe(0);
    expect(result.totalInterestAmount).toBe(0);
    expect(result.debtBurdenRatio).toBe(8.33);
    expect(result.schedule.at(-1)?.installmentAmount).toBe(83.38);
    expect(result.schedule.at(-1)?.installmentAmount).not.toBe(result.monthlyInstallment);
    expectScheduleIntegrity(input, result);
  });

  it('używa regularnej raty dla wskaźnika i nie ogranicza go do 100%', () => {
    const result = calculateLoan(typicalInput);
    const resultWithHigherObligations = calculateLoan({
      ...typicalInput,
      monthlyObligations: 2_000,
    });

    expect(result.debtBurdenRatio).toBe(113.28);
    expect(result.debtBurdenRatio).toBeGreaterThan(100);
    expect(resultWithHigherObligations.debtBurdenRatio).toBeGreaterThan(result.debtBurdenRatio);
  });

  it('zachowuje własności harmonogramu dla dużej kwoty', () => {
    const input: LoanInput = {
      loanAmount: 10_000_000,
      annualInterestRate: 12.5,
      termYears: 30,
      monthlyNetIncome: 100_000,
      monthlyObligations: 20_000,
    };

    expectScheduleIntegrity(input, calculateLoan(input));
  });

  it('zachowuje własności harmonogramu przy wysokim oprocentowaniu', () => {
    const input: LoanInput = {
      loanAmount: 250_000,
      annualInterestRate: 48,
      termYears: 5,
      monthlyNetIncome: 5_000,
      monthlyObligations: 1_500,
    };

    expectScheduleIntegrity(input, calculateLoan(input));
  });

  it('nie mutuje danych wejściowych', () => {
    const input = { ...typicalInput };
    const originalInput = { ...input };

    calculateLoan(input);

    expect(input).toEqual(originalInput);
  });
});
