import type { AprResult, ConsumerCashFlow } from '../../types/creditScenario';
import { daysBetween, minDate } from './calendar';
import { decimal, decimalToNumber, MONEY_ONE, MONEY_ZERO } from './money';

const MAX_ITERATIONS = 80;
const RATE_TOLERANCE = decimal('0.0000000001');
const NPV_TOLERANCE = decimal('0.000001');

interface PreparedCashFlow {
  amount: ReturnType<typeof decimal>;
  yearFraction: ReturnType<typeof decimal>;
}

function presentValue(flows: ReadonlyArray<PreparedCashFlow>, annualRate: ReturnType<typeof decimal>) {
  return flows.reduce((sum, flow) => {
    return sum.plus(flow.amount.div(MONEY_ONE.plus(annualRate).pow(flow.yearFraction)));
  }, MONEY_ZERO);
}

/**
 * RRSO is solved from dated consumer cash flows. Amounts received by the consumer are positive;
 * installments and mandatory costs are negative. Bisection is deliberately used as the stable
 * fallback rather than relying on Newton's method.
 */
export function calculateApr(cashFlows: ReadonlyArray<ConsumerCashFlow>): AprResult {
  const includedFlows = cashFlows.filter((flow) => flow.includedInApr);
  const hasPositive = includedFlows.some((flow) => flow.amount > 0);
  const hasNegative = includedFlows.some((flow) => flow.amount < 0);

  if (!hasPositive || !hasNegative) {
    return {
      annualPercentageRate: null,
      cashFlows: includedFlows,
      iterations: 0,
      npvResidual: null,
      reason: 'Brak pełnego zestawu dodatnich i ujemnych przepływów do obliczenia RRSO.',
    };
  }

  const origin = minDate(includedFlows.map((flow) => flow.date));
  const preparedFlows = includedFlows.map((flow) => ({
    amount: decimal(flow.amount),
    yearFraction: decimal(daysBetween(origin, flow.date)).div(365),
  }));

  let lower = decimal('-0.999999');
  let upper = decimal(1);
  let lowerValue = presentValue(preparedFlows, lower);
  let upperValue = presentValue(preparedFlows, upper);

  while (lowerValue.times(upperValue).gt(0) && upper.lt(1_000_000)) {
    upper = upper.times(2);
    upperValue = presentValue(preparedFlows, upper);
  }

  if (lowerValue.times(upperValue).gt(0)) {
    return {
      annualPercentageRate: null,
      cashFlows: includedFlows,
      iterations: 0,
      npvResidual: null,
      reason: 'Nie znaleziono przedziału zmiany znaku dla równania RRSO.',
    };
  }

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
    const middle = lower.plus(upper).div(2);
    const middleValue = presentValue(preparedFlows, middle);

    if (middleValue.abs().lte(NPV_TOLERANCE) || upper.minus(lower).abs().lte(RATE_TOLERANCE)) {
      return {
        annualPercentageRate: decimalToNumber(middle.times(100)),
        cashFlows: includedFlows,
        iterations: iteration,
        npvResidual: decimalToNumber(middleValue),
      };
    }

    if (lowerValue.times(middleValue).lte(0)) {
      upper = middle;
    } else {
      lower = middle;
      lowerValue = middleValue;
    }
  }

  const middle = lower.plus(upper).div(2);
  const residual = presentValue(preparedFlows, middle);

  return {
    annualPercentageRate: decimalToNumber(middle.times(100)),
    cashFlows: includedFlows,
    iterations: MAX_ITERATIONS,
    npvResidual: decimalToNumber(residual),
  };
}
