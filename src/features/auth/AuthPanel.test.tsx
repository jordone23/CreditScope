import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './authContext';
import { AuthPanel } from './AuthPanel';

const authContextValue: AuthContextValue = {
  isConfigured: true,
  isLoading: false,
  isPasswordRecovery: false,
  resendSignupEmail: vi.fn().mockResolvedValue(null),
  sendPasswordRecoveryEmail: vi.fn().mockResolvedValue(null),
  signIn: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
  signUp: vi.fn().mockResolvedValue(null),
  updatePassword: vi.fn().mockResolvedValue(null),
  user: null,
};

function renderAuthPanel() {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <AuthPanel />
    </AuthContext.Provider>,
  );
}

describe('AuthPanel', () => {
  it('pokazuje walidację formatu nazwy użytkownika przy rejestracji', async () => {
    const user = userEvent.setup();
    renderAuthPanel();

    await user.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
    const username = screen.getByLabelText('Nazwa użytkownika');
    await user.type(username, 'ab!');
    await user.tab();

    expect(await screen.findByText(/użyj 3–50 liter/i)).toBeVisible();
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Utwórz konto' })).toBeDisabled();
  });

  it('umożliwia pokazanie i ukrycie hasła', async () => {
    const user = userEvent.setup();
    renderAuthPanel();

    const password = screen.getByLabelText('Hasło');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Pokaż hasło' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ukryj hasło' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('prowadzi do bezpiecznego formularza resetu hasła', async () => {
    const user = userEvent.setup();
    renderAuthPanel();

    await user.click(screen.getByRole('button', { name: 'Nie pamiętasz hasła?' }));

    expect(screen.getByRole('button', { name: 'Wyślij link resetujący' })).toBeVisible();
    expect(screen.getByLabelText('E-mail')).toBeVisible();
  });
});
