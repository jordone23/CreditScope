# Financial methodology

## Purpose and scope

CreditScope is an educational loan-scenario calculator for monthly repayments in PLN. It explains the arithmetic behind a repayment plan and selected household-budget measures. It is not a lender, a financial adviser, a credit bureau, or a system for making a credit decision.

The document describes the model implemented in the application. It does not claim that every real loan contract follows the same assumptions.

## Input data used by the application

The basic form uses only five inputs:

| Input | Purpose in the calculation |
| --- | --- |
| Loan amount | Initial principal in the basic scenario. |
| Annual nominal interest rate | Converted to a monthly nominal rate. |
| Repayment term in years | Converted to the number of monthly instalments. |
| Monthly net income | Denominator of the indicative debt-service ratio. |
| Existing monthly obligations | Added to the new instalment in the budget measure. |

The advanced view additionally lets the user choose an annuity or declining variant and model one-off or recurring prepayments.

## Core assumptions of the basic scenario

The basic calculation assumes:

- one loan disbursement at the beginning of the scenario;
- a fixed nominal annual rate for the full term;
- monthly instalments paid at the end of each period;
- a monthly rate of `i = annual nominal rate / 12` after the percentage is converted to decimal form;
- no commission, mandatory insurance, recurring account fee, default fee, tax, notary cost, currency conversion, or daily-interest convention;
- no lender-specific rounding policy beyond the calculator's controlled calculation and presentation rules.

These assumptions make the scenario deterministic and comparable. They also mean that the result is not a reconstruction of a bank's actual offer.

## Annuity instalments

For initial principal `K`, monthly rate `i`, and `n` monthly instalments, the regular annuity instalment is:

```text
A = K × i / (1 − (1 + i)^−n)
```

When `i = 0`, the formula is not evaluated through division by zero. The correct limiting case is:

```text
A = K / n
```

For each period `t`:

```text
interest_t = opening_balance_(t−1) × i
principal_t = instalment_t − interest_t
closing_balance_t = opening_balance_(t−1) − principal_t
```

At the beginning of an annuity schedule, the outstanding balance is higher, so the interest component is higher and the principal component is lower. As the balance falls, the composition reverses. This is a property of the formula, not an additional charge.

## Declining instalments and prepayments

For a declining-instalment scenario, the planned principal component is constant:

```text
principal_t = K / n
interest_t = opening_balance_(t−1) × i
instalment_t = principal_t + interest_t
```

The first instalment is therefore normally higher than a comparable annuity instalment, while later instalments decline as interest falls.

In the currently implemented advanced scenario, a one-off or recurring prepayment is an additional principal repayment. The calculated effect is a shorter scenario term while preserving the planned repayment mechanics. A real lender may instead reduce the instalment, apply a different recalculation date, or require a specific instruction from the borrower; this application does not model those lender-specific rules.

## Repayment schedule and rounding

The schedule is built sequentially: each row uses the balance remaining after the preceding row. It presents the instalment, principal, interest, and balance after payment.

The calculation aims to preserve these invariants:

- the principal components repay the opening principal over a fully repaid scenario;
- each balance follows from the preceding balance less the principal component;
- the total repayment equals the sum of scheduled instalments;
- the total interest equals the sum of interest components.

Displayed money values are formatted for the active locale, but the financial scenario remains numeric. A real contract can differ by a few currency units or cents when it applies a different interest-day count or rounding sequence.

## Metrics presented in the interface

| Metric | Calculation | Interpretation |
| --- | --- | --- |
| Monthly instalment | Regular annuity instalment; for the declining variant, the first and highest instalment is relevant. | A scenario output, not a quoted bank payment. |
| Total repayment | Sum of instalments in the generated schedule. | Excludes costs that are not modelled. |
| Interest cost | Sum of scheduled interest. | In the basic fee-free scenario, it is the entire modelled credit cost. |
| Indicative debt-service ratio | `(new instalment + existing obligations) / monthly net income × 100%`. | A simple budget-burden measure, not a credit score. |
| Surplus before living costs | `monthly net income − existing obligations − new instalment`. | Does not include rent, food, dependants, transport, or other household costs. |

## APR / RRSO boundary

APR is the English equivalent of the Polish term RRSO in the relevant consumer-credit context. A meaningful APR/RRSO calculation requires all mandatory cash flows and their dates: the actual disbursement, repayments, commissions, mandatory insurance, and fees paid outside the schedule.

The basic form does not collect that complete dated cash-flow set. CreditScope therefore does not present its basic result as an actual lender APR/RRSO. This boundary is intentional: presenting a precise APR/RRSO without the required inputs would be misleading.

## Credit-risk and affordability boundary

The application can show only transparent arithmetic based on declared income and declared existing obligations. It does not calculate:

- PD, LGD, or EAD;
- credit history or current arrears;
- income stability or verification;
- household living costs;
- collateral value, LTV, or legal status of collateral;
- a bank's policy, stress scenario, approval probability, or credit score.

Consequently, a positive surplus or a lower debt-service ratio must not be labelled as “low risk” or “likely to be approved”. Loan-origination guidance and lender policies use more data and controls than a public educational calculator can obtain.

## Validation and test evidence

The repository contains automated tests for core financial behaviour and presentation boundaries, including:

- zero-interest scenarios and numeric input parsing;
- repayment schedule structure and filtering;
- annuity, declining, and prepayment scenarios;
- input validation and invalid-state handling;
- PL/EN language switching without clearing form values;
- equality of translation-key structures across locales.

See [Architecture](ARCHITECTURE.md), [Setup](SETUP.md), and the test files under `src/lib/finance/` and `src/features/calculator/` for implementation-level evidence.

## Terminology

| Polish | English used in this repository |
| --- | --- |
| rata równa | annuity instalment |
| rata malejąca | declining instalment |
| kapitał | principal |
| odsetki | interest |
| nadpłata | prepayment |
| całkowity koszt kredytu | total cost of credit |
| całkowita kwota do zapłaty | total amount payable |
| wskaźnik obciążenia dochodu | debt-service ratio |
| RRSO | APR (Annual Percentage Rate) |

## Sources and further reading

- [Directive (EU) 2023/2225 on credit agreements for consumers](https://eur-lex.europa.eu/eli/dir/2023/2225/oj/eng) — consumer-credit framework and information requirements.
- [European Banking Authority — Guidelines on loan origination and monitoring](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/credit-risk/guidelines-loan-origination-and-monitoring) — context for the difference between transparent educational measures and lender credit assessment.
- [Detailed Polish methodology archive](pl/metodologia-obliczen-kredytowych.md) — extended research, sources, and local regulatory context.
