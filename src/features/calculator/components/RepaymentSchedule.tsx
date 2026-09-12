import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <h3 id="schedule-heading">{t('schedule.heading')}</h3>
      <div className="repayment-schedule__filter">
        <label htmlFor={filterId}>{t('schedule.filter')}</label>
        <select
          id={filterId}
          value={selectedYear}
          aria-describedby={visibleCountId}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          <option value="all">{t('schedule.all')}</option>
          {repaymentYears.map((year) => (
            <option key={year} value={year}>
              {t('schedule.year', { year })}
            </option>
          ))}
        </select>
      </div>
      <p id={visibleCountId} className="repayment-schedule__visible-count">
        {t('schedule.visible', { visible: visibleSchedule.length, total: schedule.length })}
      </p>
      <div
        className="repayment-schedule__scroll"
        tabIndex={0}
        aria-label={t('schedule.scrollLabel')}
      >
        <table className="repayment-schedule__table">
          <caption>{t('schedule.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('schedule.number')}</th>
              <th scope="col">{t('schedule.installment')}</th>
              <th scope="col">{t('schedule.principal')}</th>
              <th scope="col">{t('schedule.interest')}</th>
              <th scope="col">{t('schedule.balance')}</th>
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
