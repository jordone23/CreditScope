import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { RepaymentScheduleItem } from '../../../types/loan';
import { RepaymentSchedule } from './RepaymentSchedule';

function createSchedule(length: number): RepaymentScheduleItem[] {
  return Array.from({ length }, (_, index) => {
    const installmentNumber = index + 1;

    return {
      installmentNumber,
      installmentAmount: 1000 + installmentNumber,
      principalAmount: 800 + installmentNumber,
      interestAmount: 200,
      remainingBalance: Math.max(0, 13000 - installmentNumber * 1000),
    };
  });
}

describe('RepaymentSchedule', () => {
  it('pokazuje dostępną tabelę z kompletnym harmonogramem i formatowaniem PLN', () => {
    render(<RepaymentSchedule schedule={createSchedule(13)} />);

    expect(screen.getByRole('heading', { name: /harmonogram spłat/i })).toBeVisible();
    expect(
      screen.getByRole('table', { name: /miesięczny harmonogram spłaty kredytu/i }),
    ).toBeVisible();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(screen.getByRole('columnheader', { name: 'Saldo po racie' })).toBeVisible();
    expect(screen.getAllByRole('row')).toHaveLength(14);
    expect(screen.getByText(/1001,00[\s\u00a0]zł/)).toBeVisible();
    expect(screen.getByLabelText(/przewijany poziomo harmonogram spłat/i)).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('ogranicza widok do wybranego roku spłaty', async () => {
    const user = userEvent.setup();
    render(<RepaymentSchedule schedule={createSchedule(13)} />);

    await user.selectOptions(screen.getByLabelText(/pokaż raty z roku spłaty/i), '2');

    expect(screen.getByText('Wyświetlono 1 z 13 rat.')).toBeVisible();
    const table = screen.getByRole('table', { name: /miesięczny harmonogram spłaty kredytu/i });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByRole('cell', { name: '13' })).toBeVisible();
  });

  it('resetuje filtr po otrzymaniu nowego harmonogramu', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RepaymentSchedule schedule={createSchedule(13)} />);
    const filter = screen.getByLabelText(/pokaż raty z roku spłaty/i);

    await user.selectOptions(filter, '2');
    rerender(<RepaymentSchedule schedule={createSchedule(12)} />);

    await waitFor(() => expect(filter).toHaveValue('all'));
    expect(screen.getByText('Wyświetlono 12 z 12 rat.')).toBeVisible();
  });
});
