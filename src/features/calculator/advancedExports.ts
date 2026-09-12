import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import i18n from '../../i18n/config';
import type { RepaymentScheduleItem } from '../../types/loan';

function download(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportScheduleCsv(schedule: ReadonlyArray<RepaymentScheduleItem>) {
  const csv = Papa.unparse(
    schedule.map((item) => ({
      [i18n.t('exports.installmentNumber')]: item.installmentNumber,
      [i18n.t('exports.installment')]: item.installmentAmount,
      [i18n.t('exports.principal')]: item.principalAmount,
      [i18n.t('exports.interest')]: item.interestAmount,
      [i18n.t('exports.balance')]: item.remainingBalance,
    })),
  );

  download(`\uFEFF${csv}`, i18n.t('exports.csvFilename'), 'text/csv;charset=utf-8');
}

export function exportSchedulePdf(schedule: ReadonlyArray<RepaymentScheduleItem>) {
  const document = new jsPDF();
  document.setFontSize(16);
  document.text(i18n.t('exports.pdfTitle'), 14, 18);
  document.setFontSize(10);
  schedule.slice(0, 40).forEach((item, index) => {
    document.text(
      i18n.t('exports.pdfInstallment', {
        amount: item.installmentAmount.toFixed(2),
        balance: item.remainingBalance.toFixed(2),
        number: item.installmentNumber,
      }),
      14,
      30 + index * 5,
    );
  });
  if (schedule.length > 40) {
    document.text(i18n.t('exports.pdfLimit'), 14, 240);
  }
  document.save(i18n.t('exports.pdfFilename'));
}
