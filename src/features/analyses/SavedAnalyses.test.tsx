import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/authContext';
import { SavedAnalyses } from './SavedAnalyses';
import * as savedAnalysis from './savedAnalysis';

vi.mock('./savedAnalysis', async (importOriginal) => {
  const original = await importOriginal<typeof import('./savedAnalysis')>();
  return { ...original, getSavedAnalyses: vi.fn(), getSavedAnalysis: vi.fn() };
});

const authContextValue: AuthContextValue = {
  isConfigured: true,
  isLoading: false,
  isPasswordRecovery: false,
  resendSignupEmail: vi.fn(),
  sendPasswordRecoveryEmail: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updatePassword: vi.fn(),
  user: { id: 'user-id' } as AuthContextValue['user'],
};

describe('SavedAnalyses', () => {
  it('otwiera wybraną analizę po kliknięciu jej tytułu', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const summary = {
      createdAt: '2026-08-13T10:00:00.000Z',
      id: 'analysis-id',
      monthlyInstallment: 1500,
      title: 'Mieszkanie',
    };
    const analysis = {
      input: {
        annualInterestRate: 7.5,
        loanAmount: 250000,
        monthlyNetIncome: 8000,
        monthlyObligations: 1000,
        termYears: 25,
      },
      result: {
        debtBurdenRatio: 31.25,
        monthlyInstallment: 1500,
        schedule: [],
        totalCreditCost: 200000,
        totalInterestAmount: 200000,
        totalRepaymentAmount: 450000,
      },
      summary,
    };
    vi.mocked(savedAnalysis.getSavedAnalyses).mockResolvedValue([summary]);
    vi.mocked(savedAnalysis.getSavedAnalysis).mockResolvedValue(analysis);

    render(
      <AuthContext.Provider value={authContextValue}>
        <SavedAnalyses onOpen={onOpen} refreshKey={0} />
      </AuthContext.Provider>,
    );

    await user.click(await screen.findByRole('button', { name: /mieszkanie/i }));

    expect(savedAnalysis.getSavedAnalysis).toHaveBeenCalledWith('analysis-id');
    expect(onOpen).toHaveBeenCalledWith(analysis);
  });
});
