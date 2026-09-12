# CreditScope

CreditScope is a responsive web application for educational loan simulations and indicative household-budget analysis. It makes the structure of a repayment plan visible without presenting itself as a bank offer, credit decision, or financial recommendation.

**[Portfolio](docs/PORTFOLIO.md)** · **[Architecture](docs/ARCHITECTURE.md)** · **[Methodology](docs/METHODOLOGY.md)** · **[Setup](docs/SETUP.md)**

## Why this project

The project combines a TypeScript/React interface with deterministic financial calculations, input validation, a detailed repayment schedule, and explicit methodological limits. It is designed as a portfolio project for product, frontend, and fintech-oriented engineering work.

## Features

- Annuity-loan simulation with monthly instalment, total repayment, interest cost, and indicative debt-service ratio.
- Full repayment schedule split into principal, interest, and remaining balance.
- Comparison of annuity and declining instalments, including one-off and recurring prepayment scenarios.
- CSV and PDF schedule exports.
- Optional Supabase-backed authentication and saved analyses.
- English and Polish interface with persisted language preference and locale-aware formatting.
- Validation, accessibility-focused labels, and automated unit/component tests.

## Technology

- React 19, TypeScript, Vite
- React Hook Form and Zod
- Decimal.js for financial arithmetic
- i18next / react-i18next
- Recharts, Papa Parse, jsPDF
- Supabase (optional authentication and persistence)
- Vitest, Testing Library, ESLint, Prettier

## Financial-model boundaries

The basic simulation assumes a single disbursement, a fixed nominal annual rate, monthly repayments, and no mandatory fees beyond interest. Therefore it is useful for comparing scenarios, but it is not a reconstruction of a real lender's offer.

APR/RRSO requires complete dated cash flows, including mandatory fees and their payment dates. CreditScope does not claim to calculate a lender's actual APR/RRSO from the basic form alone. The displayed debt-service ratio is educational and cannot replace a lender's creditworthiness or risk assessment.

Read the complete scope and formulas in [the methodology](docs/METHODOLOGY.md).

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run test
npm run lint
npm run build
npm run format:check
```

Authentication and saved analyses are optional. See [Setup](docs/SETUP.md) for Supabase environment variables.

## Repository guide

The root README and the concise documents in `docs/` are maintained in English for portfolio readers. The original Polish implementation notes and specifications are preserved in [docs/pl](docs/pl/README.md) as an archive.

## Disclaimer

CreditScope is for educational and informational purposes only. Its results are simplified simulations and are not a bank offer, financial recommendation, or actual creditworthiness assessment.
