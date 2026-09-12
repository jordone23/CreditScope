import { useMemo, useState } from 'react';
import '../../../i18n/config';
import { useTranslation } from 'react-i18next';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrencyPLN } from '../../../lib/formatters';
import {
  calculateAdvancedLoan,
  type RepaymentVariant,
} from '../../../lib/finance/advancedLoanCalculator';
import type { LoanInput } from '../../../types/loan';
import { exportScheduleCsv, exportSchedulePdf } from '../advancedExports';

interface AdvancedSimulationProps {
  input: LoanInput;
}

interface SavedSimulation {
  createdAt: string;
  input: LoanInput;
}

const STORAGE_KEY = 'creditscope.saved-simulations.v1';

function toPositiveNumber(value: string) {
  const parsed = Number(value.replace(',', '.'));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function AdvancedSimulation({ input }: AdvancedSimulationProps) {
  const { t } = useTranslation();
  const [variant, setVariant] = useState<RepaymentVariant>('annuity');
  const [oneTimeInstallment, setOneTimeInstallment] = useState('');
  const [oneTimeAmount, setOneTimeAmount] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const parsedOneTimeInstallment = Number(oneTimeInstallment);
  const oneTimeInstallmentIsInvalid =
    oneTimeInstallment !== '' &&
    (!Number.isSafeInteger(parsedOneTimeInstallment) ||
      parsedOneTimeInstallment < 1 ||
      parsedOneTimeInstallment > input.termYears * 12);
  const plan = useMemo(
    () => ({
      oneTimeInstallment: oneTimeInstallmentIsInvalid
        ? undefined
        : parsedOneTimeInstallment || undefined,
      oneTimeAmount: toPositiveNumber(oneTimeAmount),
      recurringAmount: toPositiveNumber(recurringAmount),
    }),
    [oneTimeAmount, oneTimeInstallmentIsInvalid, parsedOneTimeInstallment, recurringAmount],
  );
  const activeResult = useMemo(
    () => calculateAdvancedLoan(input, { variant, prepaymentPlan: plan }),
    [input, plan, variant],
  );
  const comparison = useMemo(
    () => ({
      annuity: calculateAdvancedLoan(input, { variant: 'annuity' }),
      declining: calculateAdvancedLoan(input, { variant: 'declining' }),
    }),
    [input],
  );
  const balanceData = activeResult.schedule.map((item) => ({
    installment: item.installmentNumber,
    balance: item.remainingBalance,
  }));
  const compositionData = [
    { name: t('schedule.principal'), value: input.loanAmount, color: '#006d77' },
    { name: t('schedule.interest'), value: activeResult.totalInterestAmount, color: '#d97706' },
  ];

  function saveSimulation() {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedSimulation[];
    const updated = [{ createdAt: new Date().toISOString(), input }, ...current].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedCount(updated.length);
  }

  return (
    <section className="advanced-simulation" aria-labelledby="advanced-heading">
      <h3 id="advanced-heading">{t('advanced.heading')}</h3>
      <p>{t('advanced.intro')}</p>
      <div className="advanced-simulation__comparison" aria-label={t('advanced.comparison')}>
        <article>
          <h4>{t('advanced.annuity')}</h4>
          <p>
            {t('advanced.firstInstallment', {
              amount: formatCurrencyPLN(comparison.annuity.initialInstallment),
            })}
          </p>
          <p>
            {t('advanced.cost', { amount: formatCurrencyPLN(comparison.annuity.totalCreditCost) })}
          </p>
        </article>
        <article>
          <h4>{t('advanced.declining')}</h4>
          <p>
            {t('advanced.firstInstallment', {
              amount: formatCurrencyPLN(comparison.declining.initialInstallment),
            })}
          </p>
          <p>
            {t('advanced.cost', {
              amount: formatCurrencyPLN(comparison.declining.totalCreditCost),
            })}
          </p>
        </article>
      </div>
      <fieldset className="advanced-simulation__controls">
        <legend>{t('advanced.options')}</legend>
        <label>
          {t('advanced.variant')}
          <select
            value={variant}
            onChange={(event) => setVariant(event.target.value as RepaymentVariant)}
          >
            <option value="annuity">{t('advanced.annuity')}</option>
            <option value="declining">{t('advanced.declining')}</option>
          </select>
        </label>
        <label>
          {t('advanced.oneTimeInstallment')}
          <input
            min="1"
            max={input.termYears * 12}
            value={oneTimeInstallment}
            onChange={(event) => setOneTimeInstallment(event.target.value)}
            type="number"
          />
        </label>
        {oneTimeInstallmentIsInvalid ? (
          <p className="advanced-simulation__error" role="alert">
            {t('advanced.installmentError', { max: input.termYears * 12 })}
          </p>
        ) : null}
        <label>
          {t('advanced.oneTimeAmount')}
          <input
            inputMode="decimal"
            value={oneTimeAmount}
            onChange={(event) => setOneTimeAmount(event.target.value)}
            type="text"
          />
        </label>
        <label>
          {t('advanced.recurringAmount')}
          <input
            inputMode="decimal"
            value={recurringAmount}
            onChange={(event) => setRecurringAmount(event.target.value)}
            type="text"
          />
        </label>
      </fieldset>
      <p className="advanced-simulation__summary">
        {t('advanced.selected', {
          variant: variant === 'annuity' ? t('advanced.annuity') : t('advanced.declining'),
          months: activeResult.actualTermMonths,
          amount: formatCurrencyPLN(activeResult.prepaymentTotal),
        })}
      </p>
      <div className="advanced-simulation__charts">
        <div className="advanced-chart">
          <h4>{t('advanced.balance')}</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={balanceData}>
              <XAxis dataKey="installment" name={t('advanced.installmentAxis')} />
              <YAxis width={72} />
              <Tooltip formatter={(value) => formatCurrencyPLN(Number(value))} />
              <Line
                type="monotone"
                dataKey="balance"
                name={t('advanced.balanceAxis')}
                stroke="#006d77"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="advanced-chart">
          <h4>{t('advanced.principalAndInterest')}</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={compositionData} dataKey="value" nameKey="name" outerRadius={80}>
                {compositionData.map((item) => (
                  <Cell fill={item.color} key={item.name} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrencyPLN(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="advanced-simulation__actions">
        <button type="button" onClick={() => exportScheduleCsv(activeResult.schedule)}>
          {t('advanced.exportCsv')}
        </button>
        <button type="button" onClick={() => exportSchedulePdf(activeResult.schedule)}>
          {t('advanced.exportPdf')}
        </button>
        <button type="button" onClick={saveSimulation}>
          {t('advanced.saveLocal')}
        </button>
      </div>
      {savedCount > 0 ? (
        <p role="status">{t('advanced.savedLocal', { count: savedCount })}</p>
      ) : null}
      <p className="advanced-simulation__note">{t('advanced.note')}</p>
    </section>
  );
}
