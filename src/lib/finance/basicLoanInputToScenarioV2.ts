import type { LoanInput } from '../../types/loan';
import type { CreditScenarioInput } from '../../types/creditScenario';
import { addMonths } from './calendar';
import { decimal, decimalToNumber, roundMoney } from './money';

/**
 * Historyczne analizy basic-v1 nie zawierały dat ani kosztów. Stała data startowa jest jawnym
 * technicznym założeniem adaptera i nie zmienia ich obliczeń w konwencji monthly-12.
 */
export function basicLoanInputToScenarioV2(
  input: LoanInput,
  disbursementDate = '2026-01-01',
): CreditScenarioInput {
  const loanAmount = decimalToNumber(roundMoney(decimal(input.loanAmount)));
  const monthlyNetIncome = decimalToNumber(roundMoney(decimal(input.monthlyNetIncome)));
  const monthlyObligations = decimalToNumber(roundMoney(decimal(input.monthlyObligations)));
  return {
    budget: {
      monthlyDebtObligations: monthlyObligations,
      monthlyNetIncome,
    },
    costs: [],
    currency: 'PLN',
    dayCountConvention: 'monthly-12',
    disbursements: [{ amount: loanAmount, date: disbursementDate }],
    firstInstallmentDate: addMonths(disbursementDate, 1),
    installmentCount: input.termYears * 12,
    prepayments: [],
    rateKind: 'fixed',
    ratePeriods: [{ annualNominalRate: input.annualInterestRate, sourceLabel: 'Stała stopa', startsOn: disbursementDate }],
    repaymentVariant: 'annuity',
    totalCreditAmount: loanAmount,
    version: 2,
  };
}
