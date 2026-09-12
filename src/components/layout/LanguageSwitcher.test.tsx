import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n/config';
import App from '../../app/App';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('pl');
    document.documentElement.lang = 'pl-PL';
  });

  it('changes the visible language, document locale, and saved preference without resetting the form', async () => {
    const user = userEvent.setup();
    render(<App />);

    const amount = screen.getByLabelText('Kwota kredytu');
    await user.type(amount, '120000');
    await user.click(screen.getByRole('button', { name: 'Angielski' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Simulation details' })).toBeVisible(),
    );
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Loan amount')).toHaveValue('120 000');
    expect(document.documentElement.lang).toBe('en-GB');
    expect(localStorage.getItem('creditscope.locale.v1')).toBe('en');
  });
});
