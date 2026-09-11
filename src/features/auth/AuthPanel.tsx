import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from './authContext';
import { checkUsernameAvailability, type UsernameAvailability } from './usernameAvailability';

type AuthMode = 'confirmation-sent' | 'forgot-password' | 'sign-in' | 'sign-up' | 'update-password';

const initialUsernameAvailability: UsernameAvailability = { state: 'invalid', message: '' };

function usernameStatusMessage(availability: UsernameAvailability) {
  switch (availability.state) {
    case 'available':
      return '✓ Nazwa użytkownika jest dostępna.';
    case 'invalid':
      return availability.message;
    case 'unavailable':
      return '✕ Ta nazwa użytkownika jest niedostępna. Wybierz inną.';
    case 'unavailable-service':
      return 'Nie udało się sprawdzić dostępności. Spróbuj ponownie.';
  }
}

export function AuthPanel() {
  const {
    isConfigured,
    isLoading,
    isPasswordRecovery,
    resendSignupEmail,
    sendPasswordRecoveryEmail,
    signIn,
    signOut,
    signUp,
    updatePassword,
    user,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameAvailability>(
    initialUsernameAvailability,
  );
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const usernameRequestRef = useRef(0);
  const emailId = useId();
  const passwordId = useId();
  const usernameId = useId();
  const usernameStatusId = useId();

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update-password');
      setMessage(null);
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (mode !== 'sign-up') {
      return;
    }

    const requestNumber = usernameRequestRef.current + 1;
    usernameRequestRef.current = requestNumber;
    if (username.trim() === '') {
      setIsCheckingUsername(false);
      setUsernameAvailability(initialUsernameAvailability);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsCheckingUsername(true);
      void checkUsernameAvailability(username).then((availability) => {
        if (usernameRequestRef.current === requestNumber) {
          setUsernameAvailability(availability);
          setIsCheckingUsername(false);
        }
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [mode, username]);

  useEffect(() => {
    if (mode !== 'confirmation-sent' || resendSeconds === 0) {
      return;
    }

    const timer = window.setInterval(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearInterval(timer);
  }, [mode, resendSeconds]);

  if (!isConfigured) {
    return null;
  }

  if (isLoading) {
    return <p className="auth-panel__loading">Sprawdzanie sesji…</p>;
  }

  if (user !== null && mode !== 'update-password') {
    return (
      <div className="auth-panel auth-panel--signed-in">
        <p role="status">Zalogowano: {user.email}</p>
        <button type="button" className="auth-panel__button" onClick={() => void signOut()}>
          Wyloguj się
        </button>
      </div>
    );
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
    setPassword('');
    setUsernameTouched(false);
    setUsernameAvailability(initialUsernameAvailability);
    setIsCheckingUsername(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (mode === 'sign-up') {
      setUsernameTouched(true);
      if (isCheckingUsername || usernameAvailability.state !== 'available') {
        setMessage('Sprawdź nazwę użytkownika przed utworzeniem konta.');
        return;
      }
      if (password.length < 12) {
        setMessage('Hasło musi mieć co najmniej 12 znaków.');
        return;
      }
    }

    if (mode === 'update-password' && password.length < 12) {
      setMessage('Hasło musi mieć co najmniej 12 znaków.');
      return;
    }

    setIsSubmitting(true);
    let error: string | null = null;
    if (mode === 'sign-in') {
      error = await signIn(email, password);
    } else if (mode === 'sign-up') {
      error = await signUp({ email, password, username });
    } else if (mode === 'forgot-password') {
      error = await sendPasswordRecoveryEmail(email);
    } else if (mode === 'update-password') {
      error = await updatePassword(password);
    }
    setIsSubmitting(false);

    if (error !== null) {
      setMessage(error);
      return;
    }

    if (mode === 'sign-up') {
      setMode('confirmation-sent');
      setResendSeconds(60);
      return;
    }
    if (mode === 'forgot-password') {
      setMessage('Jeżeli konto istnieje, wysłaliśmy wiadomość z linkiem do zmiany hasła.');
      return;
    }
    if (mode === 'update-password') {
      setMessage('Hasło zostało zmienione. Możesz teraz korzystać z konta.');
    }
  }

  async function handleResend() {
    setIsSubmitting(true);
    const error = await resendSignupEmail(email);
    setIsSubmitting(false);
    setResendSeconds(60);
    setMessage(error ?? 'Jeżeli konto oczekuje na potwierdzenie, wysłaliśmy nową wiadomość.');
  }

  const usernameIsInvalid = usernameTouched && usernameAvailability.state === 'invalid';
  const usernameIsUnavailable = usernameTouched && usernameAvailability.state === 'unavailable';
  const canSignUp =
    usernameAvailability.state === 'available' && !isCheckingUsername && password.length >= 12;
  const summary =
    mode === 'sign-up'
      ? 'Utwórz konto'
      : mode === 'forgot-password'
        ? 'Reset hasła'
        : mode === 'update-password'
          ? 'Nowe hasło'
          : 'Zaloguj się';

  if (mode === 'confirmation-sent') {
    return (
      <details className="auth-panel" open>
        <summary>Potwierdź e-mail</summary>
        <div className="auth-panel__confirmation" role="status">
          <p>Sprawdź skrzynkę e-mail i potwierdź adres, aby się zalogować.</p>
          <p>Nie widzisz wiadomości? Sprawdź folder spam.</p>
          {message === null ? null : <p className="auth-panel__message">{message}</p>}
          <button
            type="button"
            className="auth-panel__button"
            disabled={resendSeconds > 0 || isSubmitting}
            onClick={() => void handleResend()}
          >
            {resendSeconds > 0 ? `Wyślij ponownie za ${resendSeconds} s` : 'Wyślij ponownie'}
          </button>
          <button type="button" className="auth-panel__link" onClick={() => changeMode('sign-in')}>
            Wróć do logowania
          </button>
        </div>
      </details>
    );
  }

  return (
    <details className="auth-panel" open={mode !== 'sign-in'}>
      <summary>{summary}</summary>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        {mode === 'sign-in' || mode === 'sign-up' ? (
          <p className="auth-panel__switch">
            {mode === 'sign-in' ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
            <button
              type="button"
              className="auth-panel__link"
              onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            >
              {mode === 'sign-in' ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
        ) : null}
        {mode === 'sign-up' ? (
          <div className="auth-field">
            <label htmlFor={usernameId}>Nazwa użytkownika</label>
            <input
              id={usernameId}
              name="username"
              value={username}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              aria-invalid={usernameIsInvalid || usernameIsUnavailable}
              aria-describedby={usernameStatusId}
              onBlur={() => setUsernameTouched(true)}
              onChange={(event) => setUsername(event.target.value)}
            />
            <span
              id={usernameStatusId}
              className={`auth-field__status auth-field__status--${
                isCheckingUsername ? 'checking' : usernameAvailability.state
              }`}
              role="status"
            >
              {isCheckingUsername
                ? 'Sprawdzanie dostępności…'
                : usernameTouched
                  ? usernameStatusMessage(usernameAvailability)
                  : '3–50 znaków: litery, cyfry, _, - lub .'}
            </span>
          </div>
        ) : null}
        {mode !== 'update-password' ? (
          <div className="auth-field">
            <label htmlFor={emailId}>E-mail</label>
            <input
              id={emailId}
              name="email"
              value={email}
              type="email"
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
            {mode === 'sign-up' ? <span>Użyj adresu, do którego masz dostęp.</span> : null}
          </div>
        ) : null}
        {mode !== 'forgot-password' ? (
          <div className="auth-field">
            <label htmlFor={passwordId}>
              {mode === 'update-password' ? 'Nowe hasło' : 'Hasło'}
            </label>
            <span className="auth-field__password-control">
              <input
                id={passwordId}
                name="password"
                value={password}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={mode === 'sign-in' ? undefined : 12}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-field__password-toggle"
                aria-label={isPasswordVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              >
                {isPasswordVisible ? 'Ukryj' : 'Pokaż'}
              </button>
            </span>
            {mode === 'sign-up' || mode === 'update-password' ? (
              <span>
                {password.length === 0
                  ? 'Minimum 12 znaków.'
                  : password.length < 12
                    ? `Brakuje ${12 - password.length} znaków.`
                    : '✓ Hasło ma wymaganą długość.'}
              </span>
            ) : null}
          </div>
        ) : null}
        {message === null ? null : (
          <p className="auth-panel__message" role="status">
            {message}
          </p>
        )}
        <button
          className="auth-panel__button"
          type="submit"
          disabled={isSubmitting || (mode === 'sign-up' && !canSignUp)}
        >
          {isSubmitting
            ? 'Trwa przetwarzanie…'
            : mode === 'sign-up'
              ? 'Utwórz konto'
              : mode === 'forgot-password'
                ? 'Wyślij link resetujący'
                : mode === 'update-password'
                  ? 'Zmień hasło'
                  : 'Zaloguj się'}
        </button>
        {mode === 'sign-in' ? (
          <button
            type="button"
            className="auth-panel__link"
            onClick={() => changeMode('forgot-password')}
          >
            Nie pamiętasz hasła?
          </button>
        ) : mode === 'forgot-password' || mode === 'update-password' ? (
          <button type="button" className="auth-panel__link" onClick={() => changeMode('sign-in')}>
            Wróć do logowania
          </button>
        ) : null}
      </form>
    </details>
  );
}
