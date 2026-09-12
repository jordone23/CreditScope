import { AuthPanel } from '../../features/auth/AuthPanel';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="site-header">
      <div className="content-container site-header__content">
        <div>
          <a className="brand" href="/" aria-label={t('header.home')}>
            CreditScope
          </a>
          <p className="brand-description">{t('header.description')}</p>
        </div>
        <div className="site-header__actions">
          <LanguageSwitcher />
          <AuthPanel />
        </div>
      </div>
    </header>
  );
}
