import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateLoan } from '../../../lib/finance/loanCalculator';
import type { LoanCalculationResult, LoanInput } from '../../../types/loan';
import { CalculationResults } from './CalculationResults';
import { CalculatorState } from './CalculatorState';
import { LoanForm } from './LoanForm';
import { SavedAnalyses } from '../../analyses/SavedAnalyses';
import type { SavedAnalysis } from '../../analyses/savedAnalysis';

type CalculatorViewState = 'calculated' | 'error' | 'initial';

export function LoanCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<LoanCalculationResult | null>(null);
  const [calculatedInput, setCalculatedInput] = useState<LoanInput | null>(null);
  const [viewState, setViewState] = useState<CalculatorViewState>('initial');
  const [savedAnalysesVersion, setSavedAnalysesVersion] = useState(0);
  const [loadedInput, setLoadedInput] = useState<LoanInput | null>(null);

  function handleCalculation(input: LoanInput) {
    setResult(calculateLoan(input));
    setCalculatedInput(input);
    setViewState('calculated');
  }

  function handleInvalidSubmission() {
    setResult(null);
    setCalculatedInput(null);
    setViewState('error');
  }

  function handleValuesChange() {
    setResult(null);
    setCalculatedInput(null);
    setViewState('initial');
  }

  function handleOpenSavedAnalysis(analysis: SavedAnalysis) {
    setCalculatedInput(analysis.input);
    setLoadedInput(analysis.input);
    setResult(analysis.result);
    setViewState('calculated');
  }

  return (
    <section className="calculator" aria-labelledby="calculator-heading">
      <div className="calculator__intro">
        <p className="eyebrow">{t('calculator.eyebrow')}</p>
        <h1 id="calculator-heading">{t('calculator.title')}</h1>
        <p>{t('calculator.intro')}</p>
      </div>
      <CalculatorState state={viewState} />
      <div className="calculator__content">
        <LoanForm
          onCalculate={handleCalculation}
          onInvalid={handleInvalidSubmission}
          onValuesChange={handleValuesChange}
          valuesToLoad={loadedInput}
        />
        {result === null || calculatedInput === null ? null : (
          <CalculationResults
            input={calculatedInput}
            result={result}
            onAnalysisSaved={() => setSavedAnalysesVersion((current) => current + 1)}
          />
        )}
      </div>
      <SavedAnalyses onOpen={handleOpenSavedAnalysis} refreshKey={savedAnalysesVersion} />
    </section>
  );
}
