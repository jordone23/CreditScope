export interface LoanInput {
  /** Kwota kredytu w PLN; musi być większa od zera. */
  loanAmount: number;
  /** Nominalne oprocentowanie roczne w procentach, np. 7.5 oznacza 7,5%. */
  annualInterestRate: number;
  /** Okres spłaty w pełnych latach. */
  termYears: number;
  /** Miesięczny dochód netto w PLN; musi być większy od zera. */
  monthlyNetIncome: number;
  /** Łączna kwota istniejących miesięcznych zobowiązań w PLN. */
  monthlyObligations: number;
}

export interface RepaymentScheduleItem {
  /** Kolejny miesiąc spłaty, numerowany od 1. */
  installmentNumber: number;
  /** Łączna rata w PLN. */
  installmentAmount: number;
  /** Kapitałowa część raty w PLN. */
  principalAmount: number;
  /** Odsetkowa część raty w PLN. */
  interestAmount: number;
  /** Saldo pozostałe po opłaceniu raty, w PLN. */
  remainingBalance: number;
}

export interface LoanCalculationResult {
  monthlyInstallment: number;
  totalRepaymentAmount: number;
  totalCreditCost: number;
  totalInterestAmount: number;
  /** Wartość procentowa, np. 42.5 oznacza 42,5%. */
  debtBurdenRatio: number;
  schedule: RepaymentScheduleItem[];
}
