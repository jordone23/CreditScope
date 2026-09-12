type CalculatorViewState = 'calculated' | 'error' | 'initial';

interface CalculatorStateProps {
  state: CalculatorViewState;
}

export function CalculatorState({ state }: CalculatorStateProps) {
  const { t } = useTranslation();
  if (state === 'calculated') {
    return null;
  }

  if (state === 'error') {
    return (
      <p className="calculator-state calculator-state--error" role="alert">
        {t('calculator.state.error')}
      </p>
    );
  }

  return (
    <p className="calculator-state" role="status">
      {t('calculator.state.initial')}
    </p>
  );
}
import { useTranslation } from 'react-i18next';
