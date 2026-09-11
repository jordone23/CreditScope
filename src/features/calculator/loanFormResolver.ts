import type { FieldErrors, Resolver } from 'react-hook-form';
import type { LoanInput } from '../../types/loan';
import { loanInputSchema } from './validation/loanInputSchema';

export interface LoanFormValues {
  annualInterestRate: string;
  loanAmount: string;
  monthlyNetIncome: string;
  monthlyObligations: string;
  termYears: string;
}

const loanFormFields = [
  'loanAmount',
  'annualInterestRate',
  'termYears',
  'monthlyNetIncome',
  'monthlyObligations',
] as const satisfies readonly (keyof LoanFormValues)[];

export const defaultLoanFormValues: LoanFormValues = {
  loanAmount: '',
  annualInterestRate: '',
  termYears: '',
  monthlyNetIncome: '',
  monthlyObligations: '',
};

function isLoanFormField(value: PropertyKey): value is keyof LoanFormValues {
  return loanFormFields.includes(value as keyof LoanFormValues);
}

export function parseLoanNumber(value: string): number {
  const normalizedValue = value.trim().replace(/\s/g, '').replace(',', '.');

  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalizedValue)) {
    return Number.NaN;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

/** Formatuje część całkowitą kwoty, zachowując wpisaną część dziesiętną. */
export function formatLoanAmountInput(value: string): string {
  const compactValue = value.replace(/\s/g, '');
  const match = compactValue.match(/^([+-]?)(\d+)([,.]?.*)$/);

  if (match === null) {
    return compactValue;
  }

  const [, sign, integerPart, decimalPart] = match;

  if (integerPart.length < 5) {
    return `${sign}${integerPart}${decimalPart}`;
  }

  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${sign}${formattedIntegerPart}${decimalPart}`;
}

function parseLoanFormValues(values: LoanFormValues): LoanInput {
  return {
    loanAmount: parseLoanNumber(values.loanAmount),
    annualInterestRate: parseLoanNumber(values.annualInterestRate),
    termYears: parseLoanNumber(values.termYears),
    monthlyNetIncome: parseLoanNumber(values.monthlyNetIncome),
    monthlyObligations: parseLoanNumber(values.monthlyObligations),
  };
}

export const loanFormResolver: Resolver<LoanFormValues, undefined, LoanInput> = (values) => {
  const validation = loanInputSchema.safeParse(parseLoanFormValues(values));

  if (validation.success) {
    return { values: validation.data, errors: {} };
  }

  const errors: FieldErrors<LoanFormValues> = {};

  validation.error.issues.forEach((issue) => {
    const field = issue.path[0];

    if (isLoanFormField(field) && errors[field] === undefined) {
      errors[field] = { type: 'validation', message: issue.message };
    }
  });

  return { values: {}, errors };
};
