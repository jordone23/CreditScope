import { useEffect, type ChangeEvent } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { LoanInput } from '../../../types/loan';
import {
  defaultLoanFormValues,
  formatLoanAmountInput,
  loanFormResolver,
  type LoanFormValues,
} from '../loanFormResolver';

interface LoanFormProps {
  onCalculate: (input: LoanInput) => void;
  onInvalid: () => void;
  onValuesChange: () => void;
  valuesToLoad: LoanInput | null;
}

interface LoanFormField {
  hint: string;
  inputMode: 'decimal' | 'numeric';
  label: string;
  name: keyof LoanFormValues;
  unit: string;
}

const loanFormFields: LoanFormField[] = [
  {
    name: 'loanAmount',
    label: 'Kwota kredytu',
    unit: 'PLN',
    inputMode: 'decimal',
    hint: 'Np. 250 000 lub 250 000,50',
  },
  {
    name: 'annualInterestRate',
    label: 'Oprocentowanie nominalne w skali roku',
    unit: '%',
    inputMode: 'decimal',
    hint: 'Wpisz 0 dla kredytu bez odsetek.',
  },
  {
    name: 'termYears',
    label: 'Okres spłaty',
    unit: 'lat',
    inputMode: 'numeric',
    hint: 'Podaj pełną liczbę lat.',
  },
  {
    name: 'monthlyNetIncome',
    label: 'Miesięczny dochód netto',
    unit: 'PLN',
    inputMode: 'decimal',
    hint: 'Dochód po odliczeniu podatków i składek.',
  },
  {
    name: 'monthlyObligations',
    label: 'Miesięczne zobowiązania',
    unit: 'PLN',
    inputMode: 'decimal',
    hint: 'Wpisz 0, jeśli nie masz takich zobowiązań.',
  },
];

function focusFirstInvalidField(
  errors: FieldErrors<LoanFormValues>,
  setFocus: (name: keyof LoanFormValues) => void,
) {
  const firstInvalidField = loanFormFields.find((field) => errors[field.name] !== undefined);

  if (firstInvalidField !== undefined) {
    setFocus(firstInvalidField.name);
  }
}

function loanInputToFormValues(input: LoanInput): LoanFormValues {
  return {
    annualInterestRate: String(input.annualInterestRate),
    loanAmount: formatLoanAmountInput(String(input.loanAmount)),
    monthlyNetIncome: formatLoanAmountInput(String(input.monthlyNetIncome)),
    monthlyObligations: formatLoanAmountInput(String(input.monthlyObligations)),
    termYears: String(input.termYears),
  };
}

export function LoanForm({ onCalculate, onInvalid, onValuesChange, valuesToLoad }: LoanFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm<LoanFormValues, undefined, LoanInput>({
    defaultValues: defaultLoanFormValues,
    mode: 'onChange',
    resolver: loanFormResolver,
  });

  useEffect(() => {
    if (valuesToLoad !== null) {
      reset(loanInputToFormValues(valuesToLoad));
    }
  }, [reset, valuesToLoad]);

  return (
    <section className="calculator-form-section" aria-labelledby="form-heading">
      <h2 id="form-heading">Dane do symulacji</h2>
      <form
        className="loan-form"
        noValidate
        onChange={onValuesChange}
        onSubmit={handleSubmit(onCalculate, (formErrors) => {
          onInvalid();
          focusFirstInvalidField(formErrors, setFocus);
        })}
      >
        <div className="loan-form__fields">
          {loanFormFields.map((field) => {
            const error = errors[field.name];
            const hintId = `${field.name}-hint`;
            const errorId = `${field.name}-error`;
            const describedBy = error === undefined ? hintId : `${hintId} ${errorId}`;
            const registeredField = register(field.name);

            function handleChange(event: ChangeEvent<HTMLInputElement>) {
              if (field.unit === 'PLN') {
                event.target.value = formatLoanAmountInput(event.target.value);
              }

              registeredField.onChange(event);
            }

            return (
              <div className="form-field" key={field.name}>
                <label className="form-field__label" htmlFor={field.name}>
                  {field.label}
                </label>
                <div className="form-field__control">
                  <input
                    aria-describedby={describedBy}
                    aria-invalid={error === undefined ? undefined : true}
                    autoComplete="off"
                    id={field.name}
                    inputMode={field.inputMode}
                    type="text"
                    {...registeredField}
                    onChange={handleChange}
                  />
                  <span aria-hidden="true" className="form-field__unit">
                    {field.unit}
                  </span>
                </div>
                <p className="form-field__hint" id={hintId}>
                  {field.hint}
                </p>
                {error?.message !== undefined ? (
                  <p className="form-field__error" id={errorId}>
                    {error.message}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <button className="calculate-button" type="submit">
          Oblicz symulację
        </button>
      </form>
    </section>
  );
}
