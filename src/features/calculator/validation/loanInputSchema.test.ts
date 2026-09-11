import { describe, expect, it } from 'vitest';
import type { LoanInput } from '../../../types/loan';
import { loanInputSchema } from './loanInputSchema';

const validLoanInput: LoanInput = {
  loanAmount: 250_000,
  annualInterestRate: 7.5,
  termYears: 25,
  monthlyNetIncome: 8_000,
  monthlyObligations: 1_250,
};

const validationMessages = {
  loanAmount: 'Podaj kwotę kredytu większą od 0 zł.',
  annualInterestRate: 'Podaj oprocentowanie równe lub większe od 0%.',
  termYears: 'Podaj okres spłaty w pełnych latach, większy od 0.',
  monthlyNetIncome: 'Podaj miesięczny dochód netto większy od 0 zł.',
  monthlyObligations: 'Podaj miesięczne zobowiązania równe lub większe od 0 zł.',
} as const;

function expectFieldError(field: keyof LoanInput, value: unknown, message: string) {
  const result = loanInputSchema.safeParse({ ...validLoanInput, [field]: value });

  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: [field], message })]),
    );
  }
}

describe('loanInputSchema', () => {
  it('akceptuje typowy komplet danych wejściowych', () => {
    expect(loanInputSchema.safeParse(validLoanInput)).toMatchObject({
      success: true,
      data: validLoanInput,
    });
  });

  it('akceptuje kredyt z oprocentowaniem 0% i bez zobowiązań', () => {
    const result = loanInputSchema.safeParse({
      ...validLoanInput,
      annualInterestRate: 0,
      monthlyObligations: 0,
    });

    expect(result.success).toBe(true);
  });

  it('akceptuje wartości dziesiętne kwot i oprocentowania', () => {
    const input = {
      ...validLoanInput,
      loanAmount: 250_000.55,
      annualInterestRate: 7.25,
      monthlyNetIncome: 8_000.1,
      monthlyObligations: 1_250.99,
    };

    expect(loanInputSchema.safeParse(input)).toMatchObject({ success: true, data: input });
  });

  it.each([
    ['zerową', 0],
    ['ujemną', -1],
  ])('odrzuca %s kwotę kredytu', (_description, value) => {
    expectFieldError('loanAmount', value, validationMessages.loanAmount);
  });

  it('odrzuca ujemne oprocentowanie', () => {
    expectFieldError('annualInterestRate', -0.01, validationMessages.annualInterestRate);
  });

  it.each([
    ['zerowy', 0],
    ['ujemny', -1],
    ['niecałkowity', 1.5],
  ])('odrzuca %s okres spłaty', (_description, value) => {
    expectFieldError('termYears', value, validationMessages.termYears);
  });

  it.each([
    ['zerowy', 0],
    ['ujemny', -1],
  ])('odrzuca %s dochód netto', (_description, value) => {
    expectFieldError('monthlyNetIncome', value, validationMessages.monthlyNetIncome);
  });

  it('odrzuca ujemne miesięczne zobowiązania', () => {
    expectFieldError('monthlyObligations', -0.01, validationMessages.monthlyObligations);
  });

  it('odrzuca brakujące pole', () => {
    const inputWithoutLoanAmount: Record<string, unknown> = { ...validLoanInput };
    delete inputWithoutLoanAmount.loanAmount;
    const result = loanInputSchema.safeParse(inputWithoutLoanAmount);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['loanAmount'],
            message: validationMessages.loanAmount,
          }),
        ]),
      );
    }
  });

  it.each([NaN, Infinity, -Infinity])(
    'odrzuca nieskończoną lub nieprawidłową liczbę: %s',
    (value) => {
      expectFieldError('loanAmount', value, validationMessages.loanAmount);
    },
  );

  it.each(['250000', null, undefined])('odrzuca wartość inną niż liczba: %s', (value) => {
    expectFieldError('loanAmount', value, validationMessages.loanAmount);
  });
});
