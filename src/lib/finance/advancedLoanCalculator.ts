import Decimal from 'decimal.js';
import type { LoanCalculationResult, LoanInput, RepaymentScheduleItem } from '../../types/loan';

export type RepaymentVariant = 'annuity' | 'declining';

export interface PrepaymentPlan {
  oneTimeAmount?: number;
  oneTimeInstallment?: number;
  recurringAmount?: number;
}

export interface AdvancedLoanOptions {
  prepaymentPlan?: PrepaymentPlan;
  variant: RepaymentVariant;
}

export interface AdvancedLoanCalculationResult extends LoanCalculationResult {
  actualTermMonths: number;
  initialInstallment: number;
  prepaymentTotal: number;
  variant: RepaymentVariant;
}

const DecimalValue = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const ZERO = new DecimalValue(0);
const ONE = new DecimalValue(1);
const HUNDRED = new DecimalValue(100);
const MONTHS_IN_YEAR = 12;

function toDecimal(value: number) {
  return new DecimalValue(value.toString());
}

function roundMoney(value: Decimal) {
  return value.toDecimalPlaces(2, DecimalValue.ROUND_HALF_UP);
}

function toNumber(value: Decimal) {
  const result = value.toNumber();

  if (!Number.isFinite(result)) {
    throw new RangeError('Nie można przedstawić wyniku jako skończonej liczby.');
  }

  return Object.is(result, -0) ? 0 : result;
}

function calculateAnnuityInstallment(amount: Decimal, rate: Decimal, count: number) {
  if (rate.isZero()) {
    return roundMoney(amount.div(count));
  }

  const factor = ONE.plus(rate).pow(count);

  return roundMoney(amount.times(rate.times(factor)).div(factor.minus(ONE)));
}

function sum(schedule: RepaymentScheduleItem[], field: keyof RepaymentScheduleItem) {
  return schedule.reduce((total, item) => total.plus(toDecimal(item[field] as number)), ZERO);
}

function normalizedPlan(plan: PrepaymentPlan | undefined) {
  const recurringAmount = plan?.recurringAmount ?? 0;
  const oneTimeAmount = plan?.oneTimeAmount ?? 0;
  const oneTimeInstallment = plan?.oneTimeInstallment ?? 0;

  if (
    !Number.isFinite(recurringAmount) ||
    !Number.isFinite(oneTimeAmount) ||
    !Number.isSafeInteger(oneTimeInstallment) ||
    recurringAmount < 0 ||
    oneTimeAmount < 0 ||
    oneTimeInstallment < 0
  ) {
    throw new RangeError('Plan nadpłat zawiera nieprawidłowe wartości.');
  }

  return {
    recurringAmount: roundMoney(toDecimal(recurringAmount)),
    oneTimeAmount: roundMoney(toDecimal(oneTimeAmount)),
    oneTimeInstallment,
  };
}

export function calculateAdvancedLoan(
  input: LoanInput,
  { prepaymentPlan, variant }: AdvancedLoanOptions,
): AdvancedLoanCalculationResult {
  const installmentCount = input.termYears * MONTHS_IN_YEAR;

  if (!Number.isSafeInteger(installmentCount) || installmentCount < 1) {
    throw new RangeError('Okres spłaty musi tworzyć bezpieczną liczbę rat.');
  }

  const loanAmount = roundMoney(toDecimal(input.loanAmount));
  const obligations = roundMoney(toDecimal(input.monthlyObligations));
  const income = roundMoney(toDecimal(input.monthlyNetIncome));
  const monthlyRate = toDecimal(input.annualInterestRate).div(HUNDRED).div(MONTHS_IN_YEAR);
  const annuityInstallment = calculateAnnuityInstallment(loanAmount, monthlyRate, installmentCount);
  const decliningPrincipal = roundMoney(loanAmount.div(installmentCount));
  const plan = normalizedPlan(prepaymentPlan);
  const schedule: RepaymentScheduleItem[] = [];
  let balance = loanAmount;
  let prepaymentTotal = ZERO;

  for (
    let installmentNumber = 1;
    installmentNumber <= installmentCount && balance.gt(0);
    installmentNumber += 1
  ) {
    const interestAmount = roundMoney(balance.times(monthlyRate));
    const plannedPrincipal =
      variant === 'annuity'
        ? roundMoney(annuityInstallment.minus(interestAmount))
        : decliningPrincipal;
    const principalBeforePrepayment = DecimalValue.min(
      balance,
      DecimalValue.max(ZERO, plannedPrincipal),
    );
    const requestedPrepayment = plan.recurringAmount.plus(
      installmentNumber === plan.oneTimeInstallment ? plan.oneTimeAmount : ZERO,
    );
    const prepaymentAmount = DecimalValue.min(
      DecimalValue.max(ZERO, requestedPrepayment),
      balance.minus(principalBeforePrepayment),
    );
    const principalAmount = roundMoney(principalBeforePrepayment.plus(prepaymentAmount));
    const installmentAmount = roundMoney(principalAmount.plus(interestAmount));
    const remainingBalance = roundMoney(balance.minus(principalAmount));

    schedule.push({
      installmentNumber,
      installmentAmount: toNumber(installmentAmount),
      principalAmount: toNumber(principalAmount),
      interestAmount: toNumber(interestAmount),
      remainingBalance: toNumber(remainingBalance),
    });
    balance = remainingBalance;
    prepaymentTotal = prepaymentTotal.plus(prepaymentAmount);
  }

  const totalRepaymentAmount = roundMoney(sum(schedule, 'installmentAmount'));
  const totalInterestAmount = roundMoney(sum(schedule, 'interestAmount'));
  const initialInstallment = toDecimal(schedule[0]?.installmentAmount ?? 0);

  return {
    variant,
    monthlyInstallment: toNumber(initialInstallment),
    initialInstallment: toNumber(initialInstallment),
    totalRepaymentAmount: toNumber(totalRepaymentAmount),
    totalCreditCost: toNumber(roundMoney(totalRepaymentAmount.minus(loanAmount))),
    totalInterestAmount: toNumber(totalInterestAmount),
    debtBurdenRatio: toNumber(
      initialInstallment.plus(obligations).div(income).times(HUNDRED).toDecimalPlaces(2),
    ),
    actualTermMonths: schedule.length,
    prepaymentTotal: toNumber(roundMoney(prepaymentTotal)),
    schedule,
  };
}
