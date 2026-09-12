import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LoanCalculationResult, LoanInput } from '../../../types/loan';
import { formatCurrencyPLN, formatPercentagePL } from '../../../lib/formatters';
import { RepaymentSchedule } from './RepaymentSchedule';
import { AdvancedSimulation } from './AdvancedSimulation';
import { SaveAnalysisButton } from '../../analyses/SaveAnalysisButton';

interface CalculationResultsProps {
  input: LoanInput;
  onAnalysisSaved: () => void;
  result: LoanCalculationResult;
}

export function CalculationResults({ input, onAnalysisSaved, result }: CalculationResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();
  const resultMetrics = [
    ['monthlyInstallment', 'calculator.results.monthlyInstallment', formatCurrencyPLN],
    ['totalRepaymentAmount', 'calculator.results.totalRepayment', formatCurrencyPLN],
    ['totalCreditCost', 'calculator.results.interestCost', formatCurrencyPLN],
    ['totalInterestAmount', 'calculator.results.totalInterest', formatCurrencyPLN],
    ['debtBurdenRatio', 'calculator.results.debtRatio', formatPercentagePL],
  ] as const;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="calculation-results" aria-live="polite" aria-labelledby="results-heading">
      <h2 id="results-heading" ref={headingRef} tabIndex={-1}>
        {t('calculator.results.heading')}
      </h2>
      <dl className="results-grid">
        {resultMetrics.map(([key, label, format]) => (
          <div className="result-card" key={key}>
            <dt>{t(label)}</dt>
            <dd>{format(result[key])}</dd>
          </div>
        ))}
        <div className="result-card">
          <dt>{t('calculator.results.surplus')}</dt>
          <dd>
            {formatCurrencyPLN(
              input.monthlyNetIncome - input.monthlyObligations - result.monthlyInstallment,
            )}
          </dd>
        </div>
      </dl>
      <p className="results-note">{t('calculator.results.note')}</p>
      <SaveAnalysisButton input={input} result={result} onSaved={onAnalysisSaved} />
      <RepaymentSchedule schedule={result.schedule} />
      <AdvancedSimulation input={input} />
    </section>
  );
}
