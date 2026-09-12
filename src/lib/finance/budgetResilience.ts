import type { BudgetResilienceResult, HouseholdBudgetInput } from '../../types/creditScenario';
import { decimal, decimalToNumber, MONEY_HUNDRED, MONEY_ZERO } from './money';

export function calculateBudgetResilience(
  budget: HouseholdBudgetInput,
  maximumRequiredPayment: number,
  stressMonthlyPayment: number | null,
): BudgetResilienceResult {
  const income = decimal(budget.monthlyNetIncome);
  const obligations = decimal(budget.monthlyDebtObligations);
  const essentialCosts = budget.monthlyEssentialCosts === undefined ? null : decimal(budget.monthlyEssentialCosts);
  const payment = decimal(maximumRequiredPayment);

  if (income.lte(MONEY_ZERO)) {
    return {
      currentDebtServiceRatio: null,
      currentSurplus: null,
      maximumRequiredPayment,
      status: 'insufficient-data',
      stressDebtServiceRatio: null,
      stressMonthlyPayment,
      stressSurplus: null,
    };
  }

  const currentRatio = obligations.plus(payment).div(income).times(MONEY_HUNDRED);
  const currentSurplus = essentialCosts === null ? null : income.minus(obligations).minus(payment).minus(essentialCosts);
  const stressPayment = stressMonthlyPayment === null ? null : decimal(stressMonthlyPayment);
  const stressRatio = stressPayment === null
    ? null
    : obligations.plus(stressPayment).div(income).times(MONEY_HUNDRED);
  const stressSurplus = stressPayment === null || essentialCosts === null
    ? null
    : income.minus(obligations).minus(stressPayment).minus(essentialCosts);
  const hasNegativeSurplus = (currentSurplus?.lt(0) ?? false) || (stressSurplus?.lt(0) ?? false);

  return {
    currentDebtServiceRatio: decimalToNumber(currentRatio.toDecimalPlaces(2)),
    currentSurplus: currentSurplus === null ? null : decimalToNumber(currentSurplus.toDecimalPlaces(2)),
    maximumRequiredPayment,
    status: hasNegativeSurplus ? 'negative-surplus' : 'needs-further-analysis',
    stressDebtServiceRatio: stressRatio === null ? null : decimalToNumber(stressRatio.toDecimalPlaces(2)),
    stressMonthlyPayment,
    stressSurplus: stressSurplus === null ? null : decimalToNumber(stressSurplus.toDecimalPlaces(2)),
  };
}
