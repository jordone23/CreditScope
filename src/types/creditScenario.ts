export type RepaymentVariant = 'annuity' | 'declining' | 'interest-only' | 'balloon';
export type RateKind = 'fixed' | 'fixed-periods' | 'variable-scenario';
export type DayCountConvention = 'monthly-12' | 'actual-365' | 'actual-360';
export type CostTiming = 'upfront' | 'with-disbursement' | 'monthly' | 'on-installment' | 'final';
export type CostFunding = 'paid-by-consumer' | 'financed';
export type PrepaymentEffect = 'reduce-term' | 'reduce-installment';

export interface CreditCostInput {
  amount: number;
  funding: CostFunding;
  id: string;
  installmentNumber?: number;
  name: string;
  recurringCount?: number;
  required: boolean;
  timing: CostTiming;
}

export interface RatePeriodInput {
  annualNominalRate: number;
  sourceLabel?: string;
  startsOn: string;
}

export interface DisbursementInput {
  amount: number;
  date: string;
}

export interface PrepaymentInput {
  amount: number;
  date: string;
  effect: PrepaymentEffect;
}

export interface HouseholdBudgetInput {
  annualRateStressBuffer?: number;
  monthlyDebtObligations: number;
  monthlyEssentialCosts?: number;
  monthlyNetIncome: number;
}

export interface CreditScenarioInput {
  balloonAmount?: number;
  budget: HouseholdBudgetInput;
  costs: CreditCostInput[];
  currency: 'PLN';
  dayCountConvention: DayCountConvention;
  disbursements: DisbursementInput[];
  firstInstallmentDate: string;
  installmentCount: number;
  interestOnlyInstallmentCount?: number;
  prepayments: PrepaymentInput[];
  rateKind: RateKind;
  ratePeriods: RatePeriodInput[];
  repaymentVariant: RepaymentVariant;
  totalCreditAmount: number;
  version: 2;
}

export interface ConsumerCashFlow {
  amount: number;
  date: string;
  includedInApr: boolean;
  includedInTotalCost: boolean;
  kind: 'disbursement' | 'cost' | 'installment' | 'prepayment';
  label: string;
}

export interface CreditScheduleItem {
  annualNominalRate: number;
  date: string;
  daysInPeriod: number;
  fullPaymentAmount: number;
  installmentAmount: number;
  installmentNumber: number;
  interestAmount: number;
  otherCostAmount: number;
  prepaymentAmount: number;
  principalAmount: number;
  remainingBalance: number;
  requiredFullPaymentAmount: number;
  requiredOtherCostAmount: number;
  startingBalance: number;
}

export interface AprResult {
  annualPercentageRate: number | null;
  cashFlows: ConsumerCashFlow[];
  iterations: number;
  npvResidual: number | null;
  reason?: string;
}

export type BudgetResilienceStatus =
  | 'insufficient-data'
  | 'negative-surplus'
  | 'needs-further-analysis';

export interface BudgetResilienceResult {
  currentDebtServiceRatio: number | null;
  currentSurplus: number | null;
  maximumRequiredPayment: number;
  status: BudgetResilienceStatus;
  stressDebtServiceRatio: number | null;
  stressMonthlyPayment: number | null;
  stressSurplus: number | null;
}

export interface CreditScenarioResult {
  apr: AprResult;
  budgetResilience: BudgetResilienceResult;
  cashFlows: ConsumerCashFlow[];
  initialInstallment: number;
  maximumInstallment: number;
  requiredNonInterestCost: number;
  schedule: CreditScheduleItem[];
  totalAmountPayable: number;
  totalCreditCost: number;
  totalInterestAmount: number;
  totalRequiredConsumerOutflow: number;
}
