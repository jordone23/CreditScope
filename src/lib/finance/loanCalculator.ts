import Decimal from 'decimal.js';
import type { LoanCalculationResult, LoanInput, RepaymentScheduleItem } from '../../types/loan';

const FinancialDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

const MONEY_DECIMAL_PLACES = 2;
const MONTHS_IN_YEAR = 12;
const ZERO = new FinancialDecimal(0);
const ONE = new FinancialDecimal(1);
const ONE_HUNDRED = new FinancialDecimal(100);

function toDecimal(value: number) {
  return new FinancialDecimal(value.toString());
}

function roundMoney(value: Decimal) {
  return value.toDecimalPlaces(MONEY_DECIMAL_PLACES, FinancialDecimal.ROUND_HALF_UP);
}

function toFiniteNumber(value: Decimal): number {
  const result = value.toNumber();

  if (!Number.isFinite(result)) {
    throw new RangeError('Nie można przedstawić wyniku obliczeń jako skończonej liczby.');
  }

  return Object.is(result, -0) ? 0 : result;
}

function getInstallmentCount(termYears: number): number {
  const installmentCount = termYears * MONTHS_IN_YEAR;

  if (!Number.isSafeInteger(installmentCount) || installmentCount < 1) {
    throw new RangeError('Okres spłaty musi tworzyć bezpieczną liczbę miesięcznych rat.');
  }

  return installmentCount;
}

function calculateMonthlyInstallment(
  loanAmount: Decimal,
  monthlyRate: Decimal,
  installmentCount: number,
) {
  if (monthlyRate.isZero()) {
    return roundMoney(loanAmount.div(installmentCount));
  }

  const growthFactor = ONE.plus(monthlyRate).pow(installmentCount);
  const installment = loanAmount
    .times(monthlyRate.times(growthFactor))
    .div(growthFactor.minus(ONE));

  return roundMoney(installment);
}

function calculateSchedule(
  loanAmount: Decimal,
  monthlyRate: Decimal,
  monthlyInstallment: Decimal,
  installmentCount: number,
): RepaymentScheduleItem[] {
  const schedule: RepaymentScheduleItem[] = [];
  let balance = loanAmount;

  for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
    const interestAmount = roundMoney(balance.times(monthlyRate));
    const isLastInstallment = installmentNumber === installmentCount;
    const principalAmount = isLastInstallment
      ? balance
      : roundMoney(monthlyInstallment.minus(interestAmount));
    const installmentAmount = isLastInstallment
      ? roundMoney(principalAmount.plus(interestAmount))
      : monthlyInstallment;
    const remainingBalance = isLastInstallment ? ZERO : roundMoney(balance.minus(principalAmount));

    if (remainingBalance.isNegative()) {
      throw new RangeError('Obliczona rata przekracza pozostałe saldo przed ostatnim miesiącem.');
    }

    schedule.push({
      installmentNumber,
      installmentAmount: toFiniteNumber(installmentAmount),
      principalAmount: toFiniteNumber(principalAmount),
      interestAmount: toFiniteNumber(interestAmount),
      remainingBalance: toFiniteNumber(remainingBalance),
    });

    balance = remainingBalance;
  }

  return schedule;
}

function sumScheduleAmounts(
  schedule: RepaymentScheduleItem[],
  selector: (item: RepaymentScheduleItem) => number,
) {
  return schedule.reduce((total, item) => total.plus(toDecimal(selector(item))), ZERO);
}

export function calculateLoan(input: LoanInput): LoanCalculationResult {
  const loanAmount = roundMoney(toDecimal(input.loanAmount));
  const monthlyNetIncome = roundMoney(toDecimal(input.monthlyNetIncome));
  const monthlyObligations = roundMoney(toDecimal(input.monthlyObligations));
  const annualInterestRate = toDecimal(input.annualInterestRate);
  const installmentCount = getInstallmentCount(input.termYears);
  const monthlyRate = annualInterestRate.div(ONE_HUNDRED).div(MONTHS_IN_YEAR);
  const monthlyInstallment = calculateMonthlyInstallment(loanAmount, monthlyRate, installmentCount);
  const schedule = calculateSchedule(loanAmount, monthlyRate, monthlyInstallment, installmentCount);
  const totalRepaymentAmount = roundMoney(
    sumScheduleAmounts(schedule, (item) => item.installmentAmount),
  );
  const totalInterestAmount = roundMoney(
    sumScheduleAmounts(schedule, (item) => item.interestAmount),
  );
  const totalCreditCost = roundMoney(totalRepaymentAmount.minus(loanAmount));
  const debtBurdenRatio = monthlyInstallment
    .plus(monthlyObligations)
    .div(monthlyNetIncome)
    .times(ONE_HUNDRED)
    .toDecimalPlaces(MONEY_DECIMAL_PLACES, FinancialDecimal.ROUND_HALF_UP);

  return {
    monthlyInstallment: toFiniteNumber(monthlyInstallment),
    totalRepaymentAmount: toFiniteNumber(totalRepaymentAmount),
    totalCreditCost: toFiniteNumber(totalCreditCost),
    totalInterestAmount: toFiniteNumber(totalInterestAmount),
    debtBurdenRatio: toFiniteNumber(debtBurdenRatio),
    schedule,
  };
}
