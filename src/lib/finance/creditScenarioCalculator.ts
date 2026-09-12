import type {
  ConsumerCashFlow,
  CreditCostInput,
  CreditScenarioInput,
  CreditScenarioResult,
  CreditScheduleItem,
  PrepaymentInput,
  RatePeriodInput,
} from '../../types/creditScenario';
import { creditScenarioSchema } from '../../features/calculator/validation/creditScenarioSchema';
import { addMonths, daysBetween, minDate } from './calendar';
import { calculateApr } from './apr';
import { calculateBudgetResilience } from './budgetResilience';
import {
  decimal,
  decimalToNumber,
  MONEY_HUNDRED,
  MONEY_ONE,
  MONEY_ZERO,
  MoneyDecimal,
  roundMoney,
} from './money';

type DecimalValue = ReturnType<typeof decimal>;

interface ScheduleBuildResult {
  cashFlows: ConsumerCashFlow[];
  schedule: CreditScheduleItem[];
}

function rateForDate(periods: ReadonlyArray<RatePeriodInput>, date: string) {
  return [...periods]
    .reverse()
    .find((period) => period.startsOn <= date)?.annualNominalRate ?? periods[0].annualNominalRate;
}

function periodRate(annualRate: number, days: number, convention: CreditScenarioInput['dayCountConvention']) {
  const rate = decimal(annualRate).div(MONEY_HUNDRED);
  if (convention === 'monthly-12') {
    return rate.div(12);
  }
  return rate.times(days).div(convention === 'actual-365' ? 365 : 360);
}

function calculateAnnuity(balance: DecimalValue, rate: DecimalValue, count: number, balloon: DecimalValue) {
  if (count <= 0 || balance.lte(MONEY_ZERO)) {
    return MONEY_ZERO;
  }
  if (rate.isZero()) {
    return roundMoney(balance.minus(balloon).div(count));
  }

  const factor = MONEY_ONE.plus(rate).pow(count);
  const balloonPresentValue = balloon.div(factor);
  return roundMoney(balance.minus(balloonPresentValue).times(rate).times(factor).div(factor.minus(MONEY_ONE)));
}

function costsForInstallment(
  costs: ReadonlyArray<CreditCostInput>,
  installmentNumber: number,
  installmentCount: number,
) {
  return costs.filter((cost) => {
    if (cost.funding !== 'paid-by-consumer') {
      return false;
    }
    if (cost.timing === 'monthly') {
      return installmentNumber <= (cost.recurringCount ?? 0);
    }
    if (cost.timing === 'on-installment') {
      return installmentNumber === cost.installmentNumber;
    }
    return cost.timing === 'final' && installmentNumber === installmentCount;
  });
}

function financedCosts(scenario: CreditScenarioInput) {
  return scenario.costs
    .filter((cost) => cost.funding === 'financed')
    .reduce((sum, cost) => sum.plus(decimal(cost.amount)), MONEY_ZERO);
}

function upfrontCashFlows(scenario: CreditScenarioInput): ConsumerCashFlow[] {
  const firstDisbursementDate = minDate(scenario.disbursements.map((item) => item.date));
  const disbursements = scenario.disbursements.map((item) => ({
    amount: item.amount,
    date: item.date,
    includedInApr: true,
    includedInTotalCost: false,
    kind: 'disbursement' as const,
    label: 'Wypłata kredytu',
  }));
  const directCosts = scenario.costs
    .filter(
      (cost) =>
        cost.funding === 'paid-by-consumer' &&
        (cost.timing === 'upfront' || cost.timing === 'with-disbursement'),
    )
    .map((cost) => ({
      amount: -cost.amount,
      date: firstDisbursementDate,
      includedInApr: cost.required,
      includedInTotalCost: cost.required,
      kind: 'cost' as const,
      label: cost.name,
    }));

  return [...disbursements, ...directCosts];
}

function paymentsForDate(prepayments: ReadonlyArray<PrepaymentInput>, date: string) {
  return prepayments.filter((prepayment) => prepayment.date === date);
}

/** The shared, unformatted schedule engine. Event order on an installment date is interest, regular installment, then prepayment. */
function buildSchedule(scenario: CreditScenarioInput): ScheduleBuildResult {
  const schedule: CreditScheduleItem[] = [];
  const cashFlows = upfrontCashFlows(scenario);
  const openingBalance = scenario.disbursements.reduce((sum, item) => sum.plus(decimal(item.amount)), MONEY_ZERO)
    .plus(financedCosts(scenario));
  const firstDisbursementDate = minDate(scenario.disbursements.map((item) => item.date));
  let previousDate = firstDisbursementDate;
  let balance = roundMoney(openingBalance);
  let annuityPayment: DecimalValue | null = null;
  let previousAnnualRate: number | null = null;
  let recalculateInstallment = true;

  for (let installmentNumber = 1; installmentNumber <= scenario.installmentCount && balance.gt(0); installmentNumber += 1) {
    const date = addMonths(scenario.firstInstallmentDate, installmentNumber - 1);
    const days = Math.max(0, daysBetween(previousDate, date));
    const annualRate = rateForDate(scenario.ratePeriods, date);
    const monthlyRate = periodRate(annualRate, days || 30, scenario.dayCountConvention);
    const remainingInstallments = scenario.installmentCount - installmentNumber + 1;
    const balloon = scenario.repaymentVariant === 'balloon'
      ? decimal(scenario.balloonAmount ?? 0)
      : MONEY_ZERO;
    const startingBalance = balance;
    const interest = roundMoney(balance.times(monthlyRate));
    const isInterestOnly =
      scenario.repaymentVariant === 'interest-only' &&
      installmentNumber <= (scenario.interestOnlyInstallmentCount ?? 0);
    const rateChanged = previousAnnualRate !== null && previousAnnualRate !== annualRate;

    if (
      scenario.repaymentVariant === 'annuity' ||
      scenario.repaymentVariant === 'interest-only' ||
      scenario.repaymentVariant === 'balloon'
    ) {
      if (annuityPayment === null || rateChanged || recalculateInstallment) {
        annuityPayment = calculateAnnuity(balance, monthlyRate, remainingInstallments, balloon);
        recalculateInstallment = false;
      }
    }

    let principal = MONEY_ZERO;
    if (installmentNumber === scenario.installmentCount) {
      principal = balance;
    } else if (!isInterestOnly && scenario.repaymentVariant === 'declining') {
      principal = roundMoney(balance.minus(balloon).div(remainingInstallments));
    } else if (!isInterestOnly) {
      principal = roundMoney((annuityPayment ?? MONEY_ZERO).minus(interest));
    }
    principal = MoneyDecimal.min(balance, MoneyDecimal.max(MONEY_ZERO, principal));

    const duePrepayments = paymentsForDate(scenario.prepayments, date);
    const requestedPrepayment = duePrepayments.reduce((sum, payment) => sum.plus(decimal(payment.amount)), MONEY_ZERO);
    const prepayment = roundMoney(MoneyDecimal.min(balance.minus(principal), requestedPrepayment));
    const remainingBalance = roundMoney(balance.minus(principal).minus(prepayment));
    const directCosts = costsForInstallment(scenario.costs, installmentNumber, scenario.installmentCount);
    const otherCost = roundMoney(directCosts.reduce((sum, cost) => sum.plus(decimal(cost.amount)), MONEY_ZERO));
    const requiredOtherCost = roundMoney(
      directCosts.filter((cost) => cost.required).reduce((sum, cost) => sum.plus(decimal(cost.amount)), MONEY_ZERO),
    );
    const installmentAmount = roundMoney(principal.plus(interest));
    const fullPayment = roundMoney(installmentAmount.plus(prepayment).plus(otherCost));
    const requiredFullPayment = roundMoney(installmentAmount.plus(prepayment).plus(requiredOtherCost));

    schedule.push({
      annualNominalRate: decimalToNumber(decimal(annualRate).toDecimalPlaces(6)),
      date,
      daysInPeriod: days,
      fullPaymentAmount: decimalToNumber(fullPayment),
      installmentAmount: decimalToNumber(installmentAmount),
      installmentNumber,
      interestAmount: decimalToNumber(interest),
      otherCostAmount: decimalToNumber(otherCost),
      prepaymentAmount: decimalToNumber(prepayment),
      principalAmount: decimalToNumber(principal),
      remainingBalance: decimalToNumber(remainingBalance),
      requiredFullPaymentAmount: decimalToNumber(requiredFullPayment),
      requiredOtherCostAmount: decimalToNumber(requiredOtherCost),
      startingBalance: decimalToNumber(startingBalance),
    });

    cashFlows.push({
      amount: -decimalToNumber(requiredFullPayment),
      date,
      includedInApr: true,
      includedInTotalCost: true,
      kind: 'installment',
      label: `Rata ${installmentNumber}`,
    });
    const optionalCost = otherCost.minus(requiredOtherCost);
    if (optionalCost.gt(0)) {
      cashFlows.push({
        amount: -decimalToNumber(optionalCost),
        date,
        includedInApr: false,
        includedInTotalCost: false,
        kind: 'cost',
        label: 'Opcjonalny koszt',
      });
    }

    if (duePrepayments.some((payment) => payment.effect === 'reduce-installment')) {
      recalculateInstallment = true;
    }
    balance = remainingBalance;
    previousAnnualRate = annualRate;
    previousDate = date;
  }

  return { cashFlows, schedule };
}

function calculateStressedPayment(scenario: CreditScenarioInput) {
  const buffer = scenario.budget.annualRateStressBuffer;
  if (buffer === undefined || buffer === 0) {
    return null;
  }
  const stressedScenario: CreditScenarioInput = {
    ...scenario,
    ratePeriods: scenario.ratePeriods.map((period) => ({
      ...period,
      annualNominalRate: period.annualNominalRate + buffer,
    })),
  };
  const stressedSchedule = buildSchedule(stressedScenario).schedule;
  return Math.max(...stressedSchedule.map((item) => item.requiredFullPaymentAmount), 0);
}

export function calculateCreditScenario(
  input: CreditScenarioInput,
  options: { includeApr?: boolean } = {},
): CreditScenarioResult {
  const scenario = creditScenarioSchema.parse(input) as CreditScenarioInput;
  const { cashFlows, schedule } = buildSchedule(scenario);
  const totalRequiredConsumerOutflow = roundMoney(
    cashFlows
      .filter((flow) => flow.includedInTotalCost && flow.amount < 0)
      .reduce((sum, flow) => sum.plus(decimal(-flow.amount)), MONEY_ZERO),
  );
  const totalCreditCost = roundMoney(totalRequiredConsumerOutflow.minus(decimal(scenario.totalCreditAmount)));
  const totalInterestAmount = roundMoney(
    schedule.reduce((sum, item) => sum.plus(decimal(item.interestAmount)), MONEY_ZERO),
  );
  const requiredNonInterestCost = roundMoney(totalCreditCost.minus(totalInterestAmount));
  const maximumRequiredPayment = Math.max(...schedule.map((item) => item.requiredFullPaymentAmount), 0);
  const stressMonthlyPayment = calculateStressedPayment(scenario);

  return {
    apr:
      options.includeApr === false
        ? {
            annualPercentageRate: null,
            cashFlows: [],
            iterations: 0,
            npvResidual: null,
            reason: 'RRSO nie zostało obliczone w zgodnym widoku basic-v1.',
          }
        : calculateApr(cashFlows),
    budgetResilience: calculateBudgetResilience(scenario.budget, maximumRequiredPayment, stressMonthlyPayment),
    cashFlows,
    initialInstallment: schedule[0]?.requiredFullPaymentAmount ?? 0,
    maximumInstallment: maximumRequiredPayment,
    requiredNonInterestCost: decimalToNumber(requiredNonInterestCost),
    schedule,
    totalAmountPayable: decimalToNumber(totalRequiredConsumerOutflow),
    totalCreditCost: decimalToNumber(totalCreditCost),
    totalInterestAmount: decimalToNumber(totalInterestAmount),
    totalRequiredConsumerOutflow: decimalToNumber(totalRequiredConsumerOutflow),
  };
}
