# Portfolio overview

**[Open the live demo](https://credit-scope-sigma.vercel.app)**

## Product problem

CreditScope makes the mechanics of a loan repayment scenario understandable without claiming to reproduce a lender's offer or approval decision. A user can enter a principal amount, nominal annual rate, repayment term, monthly net income, and existing monthly obligations, then inspect the resulting repayment plan.

## What the project demonstrates

- Deterministic financial calculations separated from the React presentation layer.
- Decimal-oriented money handling, input validation, and explicit edge-case coverage.
- Annuity and declining repayment variants with one-off and recurring prepayments.
- An accessible repayment schedule with principal, interest, and outstanding balance.
- Client-side CSV/PDF export of a generated schedule.
- Optional Supabase authentication and saved analyses that do not block the core calculator.
- PL/EN localization with persisted locale preference and locale-aware value formatting.

## Technical decisions

| Decision | Rationale |
| --- | --- |
| Separate financial modules | A locale or UI-state change must never alter a scenario calculation. |
| Validation before calculation | The calculator accepts only a defined contract of finite, valid numeric inputs. |
| Local i18n resources | Financial terminology is reviewed and deterministic; no user data is sent to a translation service. |
| Optional persistence | The educational calculator can run without a backend; authentication is an enhancement. |
| Automated tests | Unit and component tests protect calculations, validation, schedules, and locale switching. |

## End-to-end flow

```text
Form input → parse and validate → calculate scenario → present metrics and schedule
                                                ├→ compare variants / prepayments
                                                ├→ export CSV or PDF
                                                └→ optionally save an authenticated analysis
```

## Boundaries

CreditScope is an educational simulator. The basic view assumes a fixed nominal rate, monthly payments, one disbursement, and no mandatory fees beyond interest. It does not calculate a lender's actual APR/RRSO, credit score, probability of approval, or bank-specific affordability decision from the basic form alone.

Read [Methodology](METHODOLOGY.md) for formulas and limits, [Architecture](ARCHITECTURE.md) for the implementation structure, and [Setup](SETUP.md) to run the project.

## Demo assets

The deployed demo is available at [credit-scope-sigma.vercel.app](https://credit-scope-sigma.vercel.app). Add reviewed screenshots under `docs/assets/` when they are available; do not use placeholders or outdated images in a portfolio presentation.
