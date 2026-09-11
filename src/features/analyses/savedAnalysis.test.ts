import { describe, expect, it } from 'vitest';
import { createSaveAnalysisPayload } from './savedAnalysis';

describe('createSaveAnalysisPayload', () => {
  it('przekazuje kompletny snapshot danych wejściowych, wyniku i harmonogramu', () => {
    const input = {
      annualInterestRate: 7.5,
      loanAmount: 250000,
      monthlyNetIncome: 8000,
      monthlyObligations: 1200,
      termYears: 25,
    };
    const result = {
      debtBurdenRatio: 34.5,
      monthlyInstallment: 1560,
      schedule: [
        {
          installmentAmount: 1560,
          installmentNumber: 1,
          interestAmount: 1500,
          principalAmount: 60,
          remainingBalance: 249940,
        },
      ],
      totalCreditCost: 218000,
      totalInterestAmount: 218000,
      totalRepaymentAmount: 468000,
    };

    expect(createSaveAnalysisPayload('  Mieszkanie  ', input, result)).toEqual({
      p_calculation_version: '1.0.0',
      p_input: input,
      p_result: {
        debtBurdenRatio: 34.5,
        monthlyInstallment: 1560,
        totalCreditCost: 218000,
        totalInterestAmount: 218000,
        totalRepaymentAmount: 468000,
      },
      p_schedule: result.schedule,
      p_title: 'Mieszkanie',
    });
  });
});
