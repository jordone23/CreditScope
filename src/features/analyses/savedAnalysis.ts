import { getSupabaseClient } from '../../lib/supabase/client';
import type { LoanCalculationResult, LoanInput } from '../../types/loan';

export interface SavedAnalysisSummary {
  createdAt: string;
  id: string;
  monthlyInstallment: number;
  title: string;
}

export interface SavedAnalysis {
  input: LoanInput;
  result: LoanCalculationResult;
  summary: SavedAnalysisSummary;
}

interface SupabaseAnalysisRow {
  created_at: string;
  id: string;
  monthly_installment: string | number;
  title: string;
}

interface SupabaseScheduleRow {
  installment_amount: string | number;
  installment_number: number;
  interest_amount: string | number;
  principal_amount: string | number;
  remaining_balance: string | number;
}

interface SupabaseSavedAnalysisRow extends SupabaseAnalysisRow {
  annual_interest_rate: string | number;
  analysis_schedule_item: SupabaseScheduleRow[];
  debt_burden_ratio: string | number;
  loan_amount: string | number;
  monthly_net_income: string | number;
  monthly_obligations: string | number;
  term_years: number;
  total_credit_cost: string | number;
  total_interest_amount: string | number;
  total_repayment_amount: string | number;
}

export function analysisTitle(date = new Date()) {
  return `Symulacja ${new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(date)}`;
}

export function createSaveAnalysisPayload(
  title: string,
  input: LoanInput,
  result: LoanCalculationResult,
) {
  return {
    p_calculation_version: '1.0.0',
    p_input: input,
    p_result: {
      debtBurdenRatio: result.debtBurdenRatio,
      monthlyInstallment: result.monthlyInstallment,
      totalCreditCost: result.totalCreditCost,
      totalInterestAmount: result.totalInterestAmount,
      totalRepaymentAmount: result.totalRepaymentAmount,
    },
    p_schedule: result.schedule.map((item) => ({
      installmentAmount: item.installmentAmount,
      installmentNumber: item.installmentNumber,
      interestAmount: item.interestAmount,
      principalAmount: item.principalAmount,
      remainingBalance: item.remainingBalance,
    })),
    p_title: title.trim() || analysisTitle(),
  };
}

export async function saveAnalysis(title: string, input: LoanInput, result: LoanCalculationResult) {
  const supabase = getSupabaseClient();
  if (supabase === null) {
    throw new Error('Supabase nie jest skonfigurowany.');
  }

  const { error } = await supabase.rpc(
    'save_analysis',
    createSaveAnalysisPayload(title, input, result),
  );
  if (error !== null) {
    if (error.code === '23505') {
      throw new Error('Istnieje już analiza o tej nazwie. Wybierz inną.');
    }

    throw new Error('Nie udało się zapisać analizy. Spróbuj ponownie.');
  }
}

export async function getSavedAnalyses(): Promise<SavedAnalysisSummary[]> {
  const supabase = getSupabaseClient();
  if (supabase === null) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_analysis')
    .select('id, title, monthly_installment, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error !== null) {
    throw new Error('Nie udało się pobrać zapisanych analiz.');
  }

  return (data as SupabaseAnalysisRow[]).map((item) => ({
    createdAt: item.created_at,
    id: item.id,
    monthlyInstallment: Number(item.monthly_installment),
    title: item.title,
  }));
}

export async function getSavedAnalysis(id: string): Promise<SavedAnalysis> {
  const supabase = getSupabaseClient();
  if (supabase === null) {
    throw new Error('Supabase nie jest skonfigurowany.');
  }

  const { data, error } = await supabase
    .from('saved_analysis')
    .select(
      'id, title, created_at, loan_amount, annual_interest_rate, term_years, monthly_net_income, monthly_obligations, monthly_installment, total_repayment_amount, total_credit_cost, total_interest_amount, debt_burden_ratio, analysis_schedule_item(installment_number, installment_amount, principal_amount, interest_amount, remaining_balance)',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error !== null || data === null) {
    throw new Error('Nie udało się otworzyć zapisanej analizy.');
  }

  const analysis = data as SupabaseSavedAnalysisRow;
  const schedule = analysis.analysis_schedule_item
    .map((item) => ({
      installmentAmount: Number(item.installment_amount),
      installmentNumber: item.installment_number,
      interestAmount: Number(item.interest_amount),
      principalAmount: Number(item.principal_amount),
      remainingBalance: Number(item.remaining_balance),
    }))
    .sort((first, second) => first.installmentNumber - second.installmentNumber);

  return {
    input: {
      annualInterestRate: Number(analysis.annual_interest_rate),
      loanAmount: Number(analysis.loan_amount),
      monthlyNetIncome: Number(analysis.monthly_net_income),
      monthlyObligations: Number(analysis.monthly_obligations),
      termYears: analysis.term_years,
    },
    result: {
      debtBurdenRatio: Number(analysis.debt_burden_ratio),
      monthlyInstallment: Number(analysis.monthly_installment),
      schedule,
      totalCreditCost: Number(analysis.total_credit_cost),
      totalInterestAmount: Number(analysis.total_interest_amount),
      totalRepaymentAmount: Number(analysis.total_repayment_amount),
    },
    summary: {
      createdAt: analysis.created_at,
      id: analysis.id,
      monthlyInstallment: Number(analysis.monthly_installment),
      title: analysis.title,
    },
  };
}

export async function deleteSavedAnalysis(id: string) {
  const supabase = getSupabaseClient();
  if (supabase === null) {
    return;
  }

  const { error } = await supabase.rpc('soft_delete_analysis', { p_analysis_id: id });
  if (error !== null) {
    throw new Error('Nie udało się usunąć analizy.');
  }
}
