import { describe, expect, it } from 'vitest';
import { defaultLoanFormValues, loanFormResolver, parseLoanNumber } from './loanFormResolver';

describe('parseLoanNumber', () => {
  it.each([
    ['7,5', 7.5],
    ['7.5', 7.5],
    [' 1200,50 ', 1200.5],
  ])('przetwarza zapis %s na liczbę %s', (value, expectedValue) => {
    expect(parseLoanNumber(value)).toBe(expectedValue);
  });

  it.each(['', '1,2,3', 'tekst'])('odrzuca nieprawidłowy zapis %s', (value) => {
    expect(Number.isNaN(parseLoanNumber(value))).toBe(true);
  });

  it('akceptuje separator tysięcy używany przez pole kwoty', () => {
    expect(parseLoanNumber('1 200')).toBe(1200);
  });
});

describe('loanFormResolver', () => {
  it('przekazuje liczby z przecinkiem do istniejącego schematu walidacji', async () => {
    const result = await loanFormResolver(
      {
        loanAmount: '120000',
        annualInterestRate: '7,5',
        termYears: '10',
        monthlyNetIncome: '10000',
        monthlyObligations: '0',
      },
      undefined,
      { criteriaMode: 'firstError', fields: {}, shouldUseNativeValidation: false },
    );

    expect(result).toEqual({
      values: {
        loanAmount: 120000,
        annualInterestRate: 7.5,
        termYears: 10,
        monthlyNetIncome: 10000,
        monthlyObligations: 0,
      },
      errors: {},
    });
  });

  it('zwraca błąd Zod dla pustej wartości zamiast zamieniać ją na zero', async () => {
    const result = await loanFormResolver(defaultLoanFormValues, undefined, {
      criteriaMode: 'firstError',
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(result.errors.loanAmount?.message).toBe('Podaj kwotę kredytu większą od 0 zł.');
  });
});
