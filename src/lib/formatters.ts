const polishLocale = 'pl-PL';

const currencyFormatter = new Intl.NumberFormat(polishLocale, {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat(polishLocale, {
  style: 'percent',
  maximumFractionDigits: 2,
});

export function formatCurrencyPLN(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercentagePL(value: number): string {
  return percentageFormatter.format(value / 100);
}
