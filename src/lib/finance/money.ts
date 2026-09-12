import Decimal from 'decimal.js';

export const MoneyDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export const MONEY_ZERO = new MoneyDecimal(0);
export const MONEY_ONE = new MoneyDecimal(1);
export const MONEY_HUNDRED = new MoneyDecimal(100);

export function decimal(value: number | string | Decimal) {
  return new MoneyDecimal(value);
}

export function roundMoney(value: Decimal) {
  return new MoneyDecimal(value).toDecimalPlaces(2, MoneyDecimal.ROUND_HALF_UP);
}

export function decimalToNumber(value: Decimal) {
  const result = new MoneyDecimal(value).toNumber();

  if (!Number.isFinite(result)) {
    throw new RangeError('Wynik finansowy nie jest skończoną liczbą.');
  }

  return Object.is(result, -0) ? 0 : result;
}
