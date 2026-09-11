import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LoanCalculator } from './LoanCalculator';

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  values = {
    loanAmount: '120000',
    annualInterestRate: '6',
    termYears: '1',
    monthlyNetIncome: '10000',
    monthlyObligations: '1000',
  },
) {
  await user.type(screen.getByLabelText(/kwota kredytu/i), values.loanAmount);
  await user.type(
    screen.getByLabelText(/oprocentowanie nominalne w skali roku/i),
    values.annualInterestRate,
  );
  await user.type(screen.getByLabelText(/okres spłaty/i), values.termYears);
  await user.type(screen.getByLabelText(/miesięczny dochód netto/i), values.monthlyNetIncome);
  await user.type(screen.getByLabelText(/miesięczne zobowiązania/i), values.monthlyObligations);
}

describe('LoanCalculator', () => {
  it('pokazuje dostępny formularz bez wyników przed przesłaniem', () => {
    render(<LoanCalculator />);

    expect(screen.getByRole('heading', { name: /dane do symulacji/i })).toBeVisible();
    expect(screen.getByLabelText(/kwota kredytu/i)).toBeVisible();
    expect(screen.getByLabelText(/oprocentowanie nominalne w skali roku/i)).toBeVisible();
    expect(screen.getByLabelText(/okres spłaty/i)).toBeVisible();
    expect(screen.getByLabelText(/miesięczny dochód netto/i)).toBeVisible();
    expect(screen.getByLabelText(/miesięczne zobowiązania/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /oblicz symulację/i })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(/uzupełnij dane formularza/i);
    expect(screen.queryByRole('heading', { name: /wynik symulacji/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /harmonogram spłat/i })).not.toBeInTheDocument();
  });

  it('pokazuje błędy Zod i ustawia fokus na pierwszym błędnym polu', async () => {
    const user = userEvent.setup();
    render(<LoanCalculator />);

    const loanAmountInput = screen.getByLabelText(/kwota kredytu/i);
    await user.click(screen.getByRole('button', { name: /oblicz symulację/i }));

    expect(await screen.findByText('Podaj kwotę kredytu większą od 0 zł.')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(/sprawdź oznaczone pola formularza/i);
    expect(loanAmountInput).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(loanAmountInput).toHaveFocus());
    expect(screen.queryByRole('heading', { name: /wynik symulacji/i })).not.toBeInTheDocument();
  });

  it('wyświetla sformatowane wyniki i przenosi fokus do ich nagłówka', async () => {
    const user = userEvent.setup();
    render(<LoanCalculator />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /oblicz symulację/i }));

    const resultsHeading = await screen.findByRole('heading', { name: /wynik symulacji/i });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Miesięczna rata').parentElement).toHaveTextContent(
      /10[\s\u00a0]327,97/,
    );
    expect(screen.getByText('Suma do spłaty').parentElement).toHaveTextContent(
      /123[\s\u00a0]935,66/,
    );
    expect(screen.getByText('Całkowity koszt kredytu').parentElement).toHaveTextContent(
      '3935,66 zł',
    );
    expect(screen.getByText('Suma odsetek').parentElement).toHaveTextContent('3935,66 zł');
    expect(screen.getByText('113,28%')).toBeVisible();
    expect(screen.getByText(/nie stanowi oceny zdolności kredytowej/i)).toBeVisible();
    expect(screen.getByRole('heading', { name: /harmonogram spłat/i })).toBeVisible();
    await waitFor(() => expect(resultsHeading).toHaveFocus());
  });

  it('akceptuje oprocentowanie zapisane z przecinkiem oraz zerowe zobowiązania', async () => {
    const user = userEvent.setup();
    render(<LoanCalculator />);

    await fillValidForm(user, {
      loanAmount: '1200',
      annualInterestRate: '0,0',
      termYears: '1',
      monthlyNetIncome: '10000',
      monthlyObligations: '0',
    });
    await user.click(screen.getByRole('button', { name: /oblicz symulację/i }));

    expect(await screen.findByRole('heading', { name: /wynik symulacji/i })).toBeVisible();
    expect(screen.getByText('Miesięczna rata').parentElement).toHaveTextContent('100,00 zł');
    expect(screen.getByText('Całkowity koszt kredytu').parentElement).toHaveTextContent('0,00 zł');
    expect(screen.getByText('Suma odsetek').parentElement).toHaveTextContent('0,00 zł');
  });

  it('ukrywa nieaktualny wynik po zmianie danych formularza', async () => {
    const user = userEvent.setup();
    render(<LoanCalculator />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /oblicz symulację/i }));
    expect(await screen.findByRole('heading', { name: /wynik symulacji/i })).toBeVisible();

    const loanAmountInput = screen.getByLabelText(/kwota kredytu/i);
    await user.clear(loanAmountInput);
    await user.type(loanAmountInput, '120001');

    expect(screen.queryByRole('heading', { name: /wynik symulacji/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /harmonogram spłat/i })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/uzupełnij dane formularza/i);
  });
});
