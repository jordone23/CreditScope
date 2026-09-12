import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { useAuth } from './authContext';
import { checkUsernameAvailability, type UsernameAvailability } from './usernameAvailability';

type AuthMode = 'confirmation-sent' | 'forgot-password' | 'sign-in' | 'sign-up' | 'update-password';

const initialUsernameAvailability: UsernameAvailability = { state: 'invalid', message: '' };

function usernameStatusKey(availability: UsernameAvailability) {
  switch (availability.state) {
    case 'available':
      return 'auth.usernameAvailable';
    case 'invalid':
      return null;
    case 'unavailable':
      return 'auth.usernameUnavailable';
    case 'unavailable-service':
      return 'auth.usernameServiceUnavailable';
  }
}

export function AuthPanel() {
  const { t } = useTranslation();
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
    return <p className="auth-panel__loading">{t('auth.loading')}</p>;
  }

  if (user !== null && mode !== 'update-password') {
    return (
      <div className="auth-panel auth-panel--signed-in">
        <p role="status">{t('auth.signedIn', { email: user.email })}</p>
        <button type="button" className="auth-panel__button" onClick={() => void signOut()}>
          {t('auth.signOut')}
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
        setMessage(t('auth.checkUsername'));
        return;
      }
      if (password.length < 12) {
        setMessage(t('auth.passwordTooShort'));
        return;
      }
    }

    if (mode === 'update-password' && password.length < 12) {
      setMessage(t('auth.passwordTooShort'));
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
      setMessage(t(error));
      return;
    }

    if (mode === 'sign-up') {
      setMode('confirmation-sent');
      setResendSeconds(60);
      return;
    }
    if (mode === 'forgot-password') {
      setMessage(t('auth.resetSent'));
      return;
    }
    if (mode === 'update-password') {
      setMessage(t('auth.passwordChanged'));
    }
  }

  async function handleResend() {
    setIsSubmitting(true);
    const error = await resendSignupEmail(email);
    setIsSubmitting(false);
    setResendSeconds(60);
    setMessage(error === null ? t('auth.confirmationResent') : t(error));
  }

  const usernameIsInvalid = usernameTouched && usernameAvailability.state === 'invalid';
  const usernameIsUnavailable = usernameTouched && usernameAvailability.state === 'unavailable';
  const canSignUp =
    usernameAvailability.state === 'available' && !isCheckingUsername && password.length >= 12;
  const summary =
    mode === 'sign-up'
      ? t('auth.createAccount')
      : mode === 'forgot-password'
        ? t('auth.passwordReset')
        : mode === 'update-password'
          ? t('auth.newPassword')
          : t('auth.signIn');

  if (mode === 'confirmation-sent') {
    return (
      <details className="auth-panel" open>
        <summary>{t('auth.confirmation')}</summary>
        <div className="auth-panel__confirmation" role="status">
          <p>{t('auth.confirmationInstruction')}</p>
          <p>{t('auth.confirmationSpam')}</p>
          {message === null ? null : <p className="auth-panel__message">{message}</p>}
          <button
            type="button"
            className="auth-panel__button"
            disabled={resendSeconds > 0 || isSubmitting}
            onClick={() => void handleResend()}
          >
            {resendSeconds > 0 ? t('auth.resendIn', { seconds: resendSeconds }) : t('auth.resend')}
          </button>
          <button type="button" className="auth-panel__link" onClick={() => changeMode('sign-in')}>
            {t('auth.backToSignIn')}
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
            {mode === 'sign-in' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              type="button"
              className="auth-panel__link"
              onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            >
              {mode === 'sign-in' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        ) : null}
        {mode === 'sign-up' ? (
          <div className="auth-field">
            <label htmlFor={usernameId}>{t('auth.username')}</label>
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
                ? t('auth.checkingUsername')
                : usernameTouched
                  ? usernameStatusKey(usernameAvailability) === null
                    ? t('auth.usernameInvalid')
                    : t(usernameStatusKey(usernameAvailability)!)
                  : t('auth.usernameHint')}
            </span>
          </div>
        ) : null}
        {mode !== 'update-password' ? (
          <div className="auth-field">
            <label htmlFor={emailId}>{t('auth.email')}</label>
            <input
              id={emailId}
              name="email"
              value={email}
              type="email"
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
            {mode === 'sign-up' ? <span>{t('auth.emailHint')}</span> : null}
          </div>
        ) : null}
        {mode !== 'forgot-password' ? (
          <div className="auth-field">
            <label htmlFor={passwordId}>
              {mode === 'update-password' ? t('auth.newPassword') : t('auth.password')}
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
                aria-label={isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
              >
                {isPasswordVisible ? t('auth.hide') : t('auth.show')}
              </button>
            </span>
            {mode === 'sign-up' || mode === 'update-password' ? (
              <span>
                {password.length === 0
                  ? t('auth.passwordMinimum')
                  : password.length < 12
                    ? t('auth.passwordMissing', { count: 12 - password.length })
                    : t('auth.passwordValid')}
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
            ? t('auth.processing')
            : mode === 'sign-up'
              ? t('auth.createAccount')
              : mode === 'forgot-password'
                ? t('auth.sendReset')
                : mode === 'update-password'
                  ? t('auth.changePassword')
                  : t('auth.signIn')}
        </button>
        {mode === 'sign-in' ? (
          <button
            type="button"
            className="auth-panel__link"
            onClick={() => changeMode('forgot-password')}
          >
            {t('auth.forgotPassword')}
          </button>
        ) : mode === 'forgot-password' || mode === 'update-password' ? (
          <button type="button" className="auth-panel__link" onClick={() => changeMode('sign-in')}>
            {t('auth.backToSignIn')}
          </button>
        ) : null}
      </form>
    </details>
  );
}
