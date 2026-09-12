# Financial methodology

CreditScope is an educational scenario calculator. It is deliberately explicit about what can and cannot be inferred from the data entered in the basic form.

## Basic annuity scenario

For principal `K`, a fixed monthly rate `i`, and `n` monthly instalments, the model uses:

```text
A = K × i / (1 − (1 + i)^−n)
```

where `A` is the regular instalment. When `i = 0`, the limiting case is `A = K / n`.

For each repayment period:

```text
interest = opening balance × i
principal = instalment − interest
closing balance = opening balance − principal
```

The advanced view also supports declining instalments and scenarios with one-off or recurring prepayments.

## Indicative budget measure

The displayed debt-service ratio is:

```text
(new instalment + existing monthly obligations) / monthly net income × 100%
```

It is not a credit score, loan approval prediction, or bank creditworthiness assessment. The basic form does not collect living costs, income stability, repayment history, collateral data, or lender-specific risk rules.

## Important limitations

- The basic model assumes a single disbursement, a fixed nominal rate, monthly periods, and no additional fees.
- It does not reproduce a contract with variable rates, daily interest conventions, mandatory insurance, commissions, payment holidays, or a lender-specific rounding policy unless those inputs are modelled explicitly.
- Actual APR/RRSO needs all mandatory dated cash flows, including fees paid outside instalments. It cannot be inferred accurately from only principal, rate, term, income, and existing obligations.

This document is deliberately concise: it describes the implemented educational model and its limits without presenting it as lending or legal advice. The detailed Polish research record, including legal and methodological sources, is available at [metodologia-obliczen-kredytowych.md](metodologia-obliczen-kredytowych.md).
