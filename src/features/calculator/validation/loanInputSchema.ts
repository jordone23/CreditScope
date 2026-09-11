import { z } from 'zod';
import type { LoanInput } from '../../../types/loan';

const validationMessages = {
  loanAmount: 'Podaj kwotę kredytu większą od 0 zł.',
  annualInterestRate: 'Podaj oprocentowanie równe lub większe od 0%.',
  termYears: 'Podaj okres spłaty w pełnych latach, większy od 0.',
  monthlyNetIncome: 'Podaj miesięczny dochód netto większy od 0 zł.',
  monthlyObligations: 'Podaj miesięczne zobowiązania równe lub większe od 0 zł.',
} as const;

function createNumberSchema(message: string) {
  return z.number({ error: message }).refine(Number.isFinite, { error: message });
}

export const loanInputSchema: z.ZodType<LoanInput> = z.object({
  loanAmount: createNumberSchema(validationMessages.loanAmount).gt(0, {
    error: validationMessages.loanAmount,
  }),
  annualInterestRate: createNumberSchema(validationMessages.annualInterestRate).gte(0, {
    error: validationMessages.annualInterestRate,
  }),
  termYears: createNumberSchema(validationMessages.termYears)
    .gt(0, { error: validationMessages.termYears })
    .refine(Number.isInteger, { error: validationMessages.termYears }),
  monthlyNetIncome: createNumberSchema(validationMessages.monthlyNetIncome).gt(0, {
    error: validationMessages.monthlyNetIncome,
  }),
  monthlyObligations: createNumberSchema(validationMessages.monthlyObligations).gte(0, {
    error: validationMessages.monthlyObligations,
  }),
});

export type ValidatedLoanInput = z.infer<typeof loanInputSchema>;
