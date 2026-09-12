import { z } from 'zod';
import { isIsoDate } from '../../../lib/finance/calendar';

const finiteNumber = (message: string) =>
  z.number({ error: message }).refine(Number.isFinite, { error: message });

const positiveAmount = (message: string) => finiteNumber(message).gt(0, { error: message });
const nonNegativeAmount = (message: string) => finiteNumber(message).gte(0, { error: message });
const isoDate = z.string().refine(isIsoDate, { error: 'Podaj poprawną datę w formacie RRRR-MM-DD.' });

const costSchema = z
  .object({
    amount: positiveAmount('Kwota kosztu musi być większa od 0.'),
    funding: z.enum(['paid-by-consumer', 'financed']),
    id: z.string().min(1, 'Koszt musi mieć identyfikator.'),
    installmentNumber: z.number().int().positive().optional(),
    name: z.string().trim().min(1, 'Podaj nazwę kosztu.'),
    recurringCount: z.number().int().positive().optional(),
    required: z.boolean(),
    timing: z.enum(['upfront', 'with-disbursement', 'monthly', 'on-installment', 'final']),
  })
  .superRefine((cost, context) => {
    if (cost.timing === 'on-installment' && cost.installmentNumber === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Dla opłaty przypisanej do raty podaj jej numer.',
        path: ['installmentNumber'],
      });
    }
    if (cost.timing === 'monthly' && cost.recurringCount === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Dla opłaty miesięcznej podaj liczbę powtórzeń.',
        path: ['recurringCount'],
      });
    }
  });

export const creditScenarioSchema = z
  .object({
    balloonAmount: nonNegativeAmount('Rata balonowa nie może być ujemna.').optional(),
    budget: z.object({
      annualRateStressBuffer: nonNegativeAmount('Bufor stopy nie może być ujemny.').optional(),
      monthlyDebtObligations: nonNegativeAmount('Zobowiązania nie mogą być ujemne.'),
      monthlyEssentialCosts: nonNegativeAmount('Koszty podstawowe nie mogą być ujemne.').optional(),
      monthlyNetIncome: positiveAmount('Dochód netto musi być większy od 0.'),
    }),
    costs: z.array(costSchema),
    currency: z.literal('PLN'),
    dayCountConvention: z.enum(['monthly-12', 'actual-365', 'actual-360']),
    disbursements: z
      .array(
        z.object({
          amount: positiveAmount('Kwota transzy musi być większa od 0.'),
          date: isoDate,
        }),
      )
      .min(1, 'Dodaj co najmniej jedną wypłatę kredytu.'),
    firstInstallmentDate: isoDate,
    installmentCount: z.number().int().positive('Liczba rat musi być większa od 0.').max(1_200),
    interestOnlyInstallmentCount: z.number().int().nonnegative().optional(),
    prepayments: z.array(
      z.object({
        amount: positiveAmount('Nadpłata musi być większa od 0.'),
        date: isoDate,
        effect: z.enum(['reduce-term', 'reduce-installment']),
      }),
    ),
    rateKind: z.enum(['fixed', 'fixed-periods', 'variable-scenario']),
    ratePeriods: z
      .array(
        z.object({
          annualNominalRate: nonNegativeAmount('Stopa nominalna nie może być ujemna.'),
          sourceLabel: z.string().optional(),
          startsOn: isoDate,
        }),
      )
      .min(1, 'Dodaj co najmniej jeden okres stopy.'),
    repaymentVariant: z.enum(['annuity', 'declining', 'interest-only', 'balloon']),
    totalCreditAmount: positiveAmount('Całkowita kwota kredytu musi być większa od 0.'),
    version: z.literal(2),
  })
  .superRefine((scenario, context) => {
    const totalDisbursements = scenario.disbursements.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(totalDisbursements - scenario.totalCreditAmount) > 0.005) {
      context.addIssue({
        code: 'custom',
        message: 'Suma transz musi być równa całkowitej kwocie kredytu.',
        path: ['disbursements'],
      });
    }

    if (scenario.disbursements.some((item) => item.date > scenario.firstInstallmentDate)) {
      context.addIssue({
        code: 'custom',
        message: 'W pierwszej wersji wszystkie transze muszą zostać wypłacone przed pierwszą ratą.',
        path: ['disbursements'],
      });
    }

    const starts = scenario.ratePeriods.map((period) => period.startsOn);
    if (new Set(starts).size !== starts.length || starts.some((date, index) => index > 0 && date <= starts[index - 1])) {
      context.addIssue({
        code: 'custom',
        message: 'Okresy stopy muszą mieć unikalne, rosnące daty początku.',
        path: ['ratePeriods'],
      });
    }

    if (scenario.ratePeriods[0]?.startsOn > scenario.firstInstallmentDate) {
      context.addIssue({
        code: 'custom',
        message: 'Pierwszy okres stopy musi zaczynać się nie później niż pierwsza rata.',
        path: ['ratePeriods'],
      });
    }

    if (scenario.repaymentVariant === 'interest-only') {
      const count = scenario.interestOnlyInstallmentCount ?? 0;
      if (count < 1 || count >= scenario.installmentCount) {
        context.addIssue({
          code: 'custom',
          message: 'Karencja odsetkowa musi obejmować od 1 do liczby rat minus 1.',
          path: ['interestOnlyInstallmentCount'],
        });
      }
    }

    if (scenario.repaymentVariant === 'balloon') {
      const balloon = scenario.balloonAmount ?? 0;
      if (balloon <= 0 || balloon >= scenario.totalCreditAmount) {
        context.addIssue({
          code: 'custom',
          message: 'Rata balonowa musi być większa od 0 i mniejsza od kwoty kredytu.',
          path: ['balloonAmount'],
        });
      }
    }

    scenario.costs.forEach((cost, index) => {
      if (cost.installmentNumber !== undefined && cost.installmentNumber > scenario.installmentCount) {
        context.addIssue({
          code: 'custom',
          message: 'Numer raty kosztu przekracza okres spłaty.',
          path: ['costs', index, 'installmentNumber'],
        });
      }
    });
  });

export type ValidatedCreditScenario = z.infer<typeof creditScenarioSchema>;
