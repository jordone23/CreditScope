import { describe, expect, it } from 'vitest';
import { formatCurrencyPLN, formatPercentagePL } from './formatters';

function normalizeSpaces(value: string): string {
  return value.replace(/\s/g, ' ');
}

describe('formatCurrencyPLN', () => {
  it('formatuje kwotę w PLN z dwoma miejscami po przecinku', () => {
    expect(normalizeSpaces(formatCurrencyPLN(12345.5))).toBe('12 345,50 zł');
  });
});

describe('formatPercentagePL', () => {
  it('interpretuje argument jako wartość procentową, nie ułamek', () => {
    expect(formatPercentagePL(7.5)).toBe('7,5%');
  });
});

describe('formatters with English locale', () => {
  it('uses English decimal separators while keeping PLN', () => {
    expect(formatCurrencyPLN(12345.5, 'en-GB')).toContain('12,345.50');
    expect(formatPercentagePL(7.5, 'en-GB')).toBe('7.5%');
  });
});
