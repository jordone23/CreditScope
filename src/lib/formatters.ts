import i18n, { localeFor } from '../i18n/config';

function currentLocale() {
  return localeFor(i18n.resolvedLanguage ?? i18n.language);
}

export function formatCurrencyPLN(value: number, locale = currentLocale()): string {
  return new Intl.NumberFormat(locale, {
    currency: 'PLN',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
}

export function formatPercentagePL(value: number, locale = currentLocale()): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    style: 'percent',
  }).format(value / 100);
}
