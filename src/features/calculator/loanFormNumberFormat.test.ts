import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { formatLoanAmountInput, parseLoanNumber } from './loanFormResolver';
import { LoanCalculator } from './components/LoanCalculator';

describe('loan amount input formatting', () => {
  it.each([
    ['9999', '9999'],
    ['10000', '10 000'],
    ['250000', '250 000'],
    ['250000,50', '250 000,50'],
    ['250 000.50', '250 000.50'],
  ])('formats %s as %s', (value, expectedValue) => {
    expect(formatLoanAmountInput(value)).toBe(expectedValue);
  });

  it('parses grouped amount values', () => {
    expect(parseLoanNumber('250 000,50')).toBe(250000.5);
  });

  it('shows thousands separators while a PLN field is being filled', async () => {
    const user = userEvent.setup();
    render(createElement(LoanCalculator));

    const loanAmount = screen.getByLabelText(/kwota kredytu/i);
    await user.type(loanAmount, '250000');

    expect(loanAmount).toHaveValue('250 000');
  });
});
