import { useEffect, useId, useMemo, useState } from 'react';
import { formatCurrencyPLN } from '../../../lib/formatters';
import type { RepaymentScheduleItem } from '../../../types/loan';

interface RepaymentScheduleProps {
  schedule: ReadonlyArray<RepaymentScheduleItem>;
}

const INSTALLMENTS_PER_YEAR = 12;

function getRepaymentYears(scheduleLength: number): number[] {
  return Array.from(
    { length: Math.ceil(scheduleLength / INSTALLMENTS_PER_YEAR) },
    (_, index) => index + 1,
  );
}

function getRepaymentYear(installmentNumber: number): number {
  return Math.ceil(installmentNumber / INSTALLMENTS_PER_YEAR);
}

export function RepaymentSchedule({ schedule }: RepaymentScheduleProps) {
  const [selectedYear, setSelectedYear] = useState('all');
  const filterId = useId();
  const visibleCountId = useId();
  const repaymentYears = useMemo(() => getRepaymentYears(schedule.length), [schedule.length]);
  const visibleSchedule = useMemo(() => {
    if (selectedYear === 'all') {
      return schedule;
    }

    const year = Number(selectedYear);

    return schedule.filter((item) => getRepaymentYear(item.installmentNumber) === year);
  }, [schedule, selectedYear]);

  useEffect(() => {
    setSelectedYear('all');
  }, [schedule]);

  return (
    <section className="repayment-schedule" aria-labelledby="schedule-heading">
      <h3 id="schedule-heading">Harmonogram spłat</h3>
      <div className="repayment-schedule__filter">
        <label htmlFor={filterId}>Pokaż raty z roku spłaty</label>
        <select
          id={filterId}
          value={selectedYear}
          aria-describedby={visibleCountId}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          <option value="all">Wszystkie raty</option>
          {repaymentYears.map((year) => (
            <option key={year} value={year}>
              Rok {year}
            </option>
          ))}
        </select>
      </div>
      <p id={visibleCountId} className="repayment-schedule__visible-count">
        Wyświetlono {visibleSchedule.length} z {schedule.length} rat.
      </p>
      <div
        className="repayment-schedule__scroll"
        tabIndex={0}
        aria-label="Przewijany poziomo harmonogram spłat"
      >
        <table className="repayment-schedule__table">
          <caption>Miesięczny harmonogram spłaty kredytu.</caption>
          <thead>
            <tr>
              <th scope="col">Nr raty</th>
              <th scope="col">Rata</th>
              <th scope="col">Kapitał</th>
              <th scope="col">Odsetki</th>
              <th scope="col">Saldo po racie</th>
            </tr>
          </thead>
          <tbody>
            {visibleSchedule.map((item) => (
              <tr key={item.installmentNumber}>
                <td>{item.installmentNumber}</td>
                <td>{formatCurrencyPLN(item.installmentAmount)}</td>
                <td>{formatCurrencyPLN(item.principalAmount)}</td>
                <td>{formatCurrencyPLN(item.interestAmount)}</td>
                <td>{formatCurrencyPLN(item.remainingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
