import { useEffect, type ChangeEvent } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { LoanInput } from '../../../types/loan';
import {
  defaultLoanFormValues,
  formatLoanAmountInput,
  localizedLoanFormResolver,
  type LoanFormValues,
} from '../loanFormResolver';

interface LoanFormProps {
  onCalculate: (input: LoanInput) => void;
  onInvalid: () => void;
  onValuesChange: () => void;
  valuesToLoad: LoanInput | null;
}

interface LoanFormField {
  hintKey: string;
  inputMode: 'decimal' | 'numeric';
  labelKey: string;
  name: keyof LoanFormValues;
  unit: string;
  unitKey?: string;
}

const loanFormFields: LoanFormField[] = [
  {
    name: 'loanAmount',
    labelKey: 'calculator.form.loanAmount',
    unit: 'PLN',
    inputMode: 'decimal',
    hintKey: 'calculator.form.loanAmountHint',
  },
  {
    name: 'annualInterestRate',
    labelKey: 'calculator.form.annualInterestRate',
    unit: '%',
    inputMode: 'decimal',
    hintKey: 'calculator.form.annualInterestRateHint',
  },
  {
    name: 'termYears',
    labelKey: 'calculator.form.termYears',
    unit: 'years',
    unitKey: 'calculator.form.years',
    inputMode: 'numeric',
    hintKey: 'calculator.form.termYearsHint',
  },
  {
    name: 'monthlyNetIncome',
    labelKey: 'calculator.form.monthlyNetIncome',
    unit: 'PLN',
    inputMode: 'decimal',
    hintKey: 'calculator.form.monthlyNetIncomeHint',
  },
  {
    name: 'monthlyObligations',
    labelKey: 'calculator.form.monthlyObligations',
    unit: 'PLN',
    inputMode: 'decimal',
    hintKey: 'calculator.form.monthlyObligationsHint',
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
  const { t } = useTranslation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm<LoanFormValues, undefined, LoanInput>({
    defaultValues: defaultLoanFormValues,
    mode: 'onChange',
    resolver: localizedLoanFormResolver,
  });

  useEffect(() => {
    if (valuesToLoad !== null) {
      reset(loanInputToFormValues(valuesToLoad));
    }
  }, [reset, valuesToLoad]);

  return (
    <section className="calculator-form-section" aria-labelledby="form-heading">
      <h2 id="form-heading">{t('calculator.form.heading')}</h2>
      <p className="form-assumption">{t('calculator.form.assumption')}</p>
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
                  {t(field.labelKey)}
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
                    {field.unitKey === undefined ? field.unit : t(field.unitKey)}
                  </span>
                </div>
                <p className="form-field__hint" id={hintId}>
                  {t(field.hintKey)}
                </p>
                {error?.message !== undefined ? (
                  <p className="form-field__error" id={errorId}>
                    {t(error.message)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <button className="calculate-button" type="submit">
          {t('calculator.form.submit')}
        </button>
      </form>
    </section>
  );
}
