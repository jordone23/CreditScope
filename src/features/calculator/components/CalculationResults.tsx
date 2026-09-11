import { useEffect, useRef } from 'react';
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

const resultMetrics = [
  {
    key: 'monthlyInstallment',
    label: 'Miesięczna rata',
    format: formatCurrencyPLN,
  },
  {
    key: 'totalRepaymentAmount',
    label: 'Suma do spłaty',
    format: formatCurrencyPLN,
  },
  {
    key: 'totalCreditCost',
    label: 'Całkowity koszt kredytu',
    format: formatCurrencyPLN,
  },
  {
    key: 'totalInterestAmount',
    label: 'Suma odsetek',
    format: formatCurrencyPLN,
  },
  {
    key: 'debtBurdenRatio',
    label: 'Orientacyjny wskaźnik obciążenia dochodu',
    format: formatPercentagePL,
  },
] as const;

export function CalculationResults({ input, onAnalysisSaved, result }: CalculationResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="calculation-results" aria-live="polite" aria-labelledby="results-heading">
      <h2 id="results-heading" ref={headingRef} tabIndex={-1}>
        Wynik symulacji
      </h2>
      <dl className="results-grid">
        {resultMetrics.map((metric) => (
          <div className="result-card" key={metric.key}>
            <dt>{metric.label}</dt>
            <dd>{metric.format(result[metric.key])}</dd>
          </div>
        ))}
      </dl>
      <p className="results-note">
        Wskaźnik pokazuje udział raty i podanych zobowiązań w miesięcznym dochodzie netto. To
        wyłącznie informacja edukacyjna — nie stanowi oceny zdolności kredytowej ani rekomendacji
        finansowej.
      </p>
      <SaveAnalysisButton input={input} result={result} onSaved={onAnalysisSaved} />
      <RepaymentSchedule schedule={result.schedule} />
      <AdvancedSimulation input={input} />
    </section>
  );
}
