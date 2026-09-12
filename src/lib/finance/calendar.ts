const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function dateParts(value: string) {
  if (!isIsoDate(value)) {
    throw new RangeError(`Nieprawidłowa data ISO: ${value}`);
  }

  return value.split('-').map(Number) as [number, number, number];
}

function formatDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

export function addMonths(dateValue: string, count: number) {
  const [year, month, day] = dateParts(dateValue);
  const targetMonthIndex = year * 12 + (month - 1) + count;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();

  return formatDate(targetYear, targetMonth, Math.min(day, lastDay));
}

export function daysBetween(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = dateParts(from);
  const [toYear, toMonth, toDay] = dateParts(to);
  const fromTime = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toTime = Date.UTC(toYear, toMonth - 1, toDay);

  return Math.round((toTime - fromTime) / 86_400_000);
}

export function minDate(values: string[]) {
  return [...values].sort()[0];
}
