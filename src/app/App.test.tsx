import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('wyświetla formularz, nazwę produktu oraz zastrzeżenie edukacyjne', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /creditscope.*strona główna/i })).toBeVisible();
    expect(
      screen.getByText(/symulacja kredytu i orientacyjna analiza obciążenia budżetu/i),
    ).toBeVisible();
    expect(screen.getByRole('heading', { name: /dane do symulacji/i })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(/uzupełnij dane formularza/i);
    expect(screen.getByText(/charakter wyłącznie edukacyjny i informacyjny/i)).toBeVisible();
  });
});
