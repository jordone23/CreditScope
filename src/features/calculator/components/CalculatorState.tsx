type CalculatorViewState = 'calculated' | 'error' | 'initial';

interface CalculatorStateProps {
  state: CalculatorViewState;
}

export function CalculatorState({ state }: CalculatorStateProps) {
  if (state === 'calculated') {
    return null;
  }

  if (state === 'error') {
    return (
      <p className="calculator-state calculator-state--error" role="alert">
        Sprawdź oznaczone pola formularza i popraw dane przed obliczeniem symulacji.
      </p>
    );
  }

  return (
    <p className="calculator-state" role="status">
      Uzupełnij dane formularza, aby obliczyć orientacyjną symulację rat równych.
    </p>
  );
}
