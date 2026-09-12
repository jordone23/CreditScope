import type { LoanCalculationResult, LoanInput } from '../../types/loan';
import { basicLoanInputToScenarioV2 } from './basicLoanInputToScenarioV2';
import { calculateCreditScenario } from './creditScenarioCalculator';
import { decimal, decimalToNumber, MONEY_HUNDRED, roundMoney } from './money';

/** Compatibility facade for basic-v1 callers. All financial calculations use the v2 scenario engine. */
export function calculateLoan(input: LoanInput): LoanCalculationResult {
  const result = calculateCreditScenario(basicLoanInputToScenarioV2(input), { includeApr: false });
  const income = roundMoney(decimal(input.monthlyNetIncome));
  const obligations = roundMoney(decimal(input.monthlyObligations));
  const debtBurdenRatio = decimalToNumber(
    roundMoney(decimal(result.initialInstallment).plus(obligations).div(income).times(MONEY_HUNDRED)),
  );

  return {
    debtBurdenRatio,
    monthlyInstallment: result.initialInstallment,
    schedule: result.schedule.map((item) => ({
      installmentAmount: item.installmentAmount,
      installmentNumber: item.installmentNumber,
      interestAmount: item.interestAmount,
      principalAmount: item.principalAmount,
      remainingBalance: item.remainingBalance,
    })),
    totalCreditCost: result.totalCreditCost,
    totalInterestAmount: result.totalInterestAmount,
    totalRepaymentAmount: result.totalAmountPayable,
  };
}
