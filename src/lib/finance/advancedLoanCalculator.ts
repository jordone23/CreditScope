import type { LoanCalculationResult, LoanInput } from '../../types/loan';
import type { RepaymentVariant } from '../../types/creditScenario';
import { basicLoanInputToScenarioV2 } from './basicLoanInputToScenarioV2';
import { addMonths } from './calendar';
import { calculateCreditScenario } from './creditScenarioCalculator';

export type { RepaymentVariant } from '../../types/creditScenario';

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

function assertPlan(plan: PrepaymentPlan | undefined, installmentCount: number) {
  const recurringAmount = plan?.recurringAmount ?? 0;
  const oneTimeAmount = plan?.oneTimeAmount ?? 0;
  const oneTimeInstallment = plan?.oneTimeInstallment ?? 0;
  if (
    !Number.isFinite(recurringAmount) ||
    !Number.isFinite(oneTimeAmount) ||
    !Number.isSafeInteger(oneTimeInstallment) ||
    recurringAmount < 0 ||
    oneTimeAmount < 0 ||
    oneTimeInstallment < 0 ||
    oneTimeInstallment > installmentCount
  ) {
    throw new RangeError('Plan nadpłat zawiera nieprawidłowe wartości.');
  }
  return { recurringAmount, oneTimeAmount, oneTimeInstallment };
}

/** Compatibility facade for the former advanced view; it also delegates to the shared v2 engine. */
export function calculateAdvancedLoan(
  input: LoanInput,
  { prepaymentPlan, variant }: AdvancedLoanOptions,
): AdvancedLoanCalculationResult {
  const scenario = basicLoanInputToScenarioV2(input);
  const plan = assertPlan(prepaymentPlan, scenario.installmentCount);
  const prepayments = [];
  for (let installment = 1; installment <= scenario.installmentCount; installment += 1) {
    const amount = plan.recurringAmount + (installment === plan.oneTimeInstallment ? plan.oneTimeAmount : 0);
    if (amount > 0) {
      prepayments.push({
        amount,
        date: addMonths(scenario.firstInstallmentDate, installment - 1),
        effect: 'reduce-term' as const,
      });
    }
  }
  const result = calculateCreditScenario(
    { ...scenario, prepayments, repaymentVariant: variant },
    { includeApr: false },
  );
  const schedule = result.schedule.map((item) => ({
    installmentAmount: item.installmentAmount,
    installmentNumber: item.installmentNumber,
    interestAmount: item.interestAmount,
    principalAmount: item.principalAmount + item.prepaymentAmount,
    remainingBalance: item.remainingBalance,
  }));

  return {
    actualTermMonths: schedule.length,
    debtBurdenRatio: result.budgetResilience.currentDebtServiceRatio ?? 0,
    initialInstallment: result.initialInstallment,
    monthlyInstallment: result.initialInstallment,
    prepaymentTotal: result.schedule.reduce((sum, item) => sum + item.prepaymentAmount, 0),
    schedule,
    totalCreditCost: result.totalCreditCost,
    totalInterestAmount: result.totalInterestAmount,
    totalRepaymentAmount: result.totalAmountPayable,
    variant,
  };
}
