# Architecture

CreditScope is a client-side React application built with Vite and TypeScript. It keeps calculation logic separate from presentation so that changing the language or UI state does not alter a financial scenario.

## Main flow

```text
Loan form → parsing and validation → financial calculator → result model
                                                     ├→ result cards
                                                     ├→ repayment schedule
                                                     ├→ advanced scenarios and charts
                                                     └→ CSV/PDF export
```

## Key areas

- `src/features/calculator/` contains form handling, results, schedules, advanced scenarios and exports.
- `src/lib/finance/` contains deterministic calculation utilities and their tests.
- `src/features/auth/` and `src/features/analyses/` provide optional Supabase-backed account and persistence features.
- `src/i18n/` owns the local PL/EN resources, locale selection, and persistence of the language preference.
- `src/lib/formatters.ts` formats values only at the presentation boundary; stored scenario values remain numeric.

## Design principles

- Financial input and output values are not translated or recalculated when the language changes.
- User-provided analysis titles remain user data and are not machine-translated.
- Supabase is optional: the calculator remains usable without its environment variables.
- User-facing service errors are mapped to controlled product messages instead of exposing provider errors.

For formulas, assumptions, and limitations, see [Methodology](METHODOLOGY.md).
