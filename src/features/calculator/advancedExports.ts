import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
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
      'Nr raty': item.installmentNumber,
      Rata: item.installmentAmount,
      Kapitał: item.principalAmount,
      Odsetki: item.interestAmount,
      'Saldo po racie': item.remainingBalance,
    })),
  );

  download(`\uFEFF${csv}`, 'harmonogram-creditscope.csv', 'text/csv;charset=utf-8');
}

export function exportSchedulePdf(schedule: ReadonlyArray<RepaymentScheduleItem>) {
  const document = new jsPDF();
  document.setFontSize(16);
  document.text('CreditScope — harmonogram spłat', 14, 18);
  document.setFontSize(10);
  schedule.slice(0, 40).forEach((item, index) => {
    document.text(
      `${item.installmentNumber}. rata ${item.installmentAmount.toFixed(2)} PLN, saldo ${item.remainingBalance.toFixed(2)} PLN`,
      14,
      30 + index * 5,
    );
  });
  if (schedule.length > 40) {
    document.text(
      'Eksport PDF zawiera pierwsze 40 rat. Pełny harmonogram udostępnia CSV.',
      14,
      240,
    );
  }
  document.save('harmonogram-creditscope.pdf');
}
