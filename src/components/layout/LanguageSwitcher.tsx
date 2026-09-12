import { useTranslation } from 'react-i18next';
import { setLanguage, type SupportedLanguage } from '../../i18n/config';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const activeLanguage: SupportedLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'pl';

  function button(language: SupportedLanguage, label: string, accessibleLabel: string) {
    const active = activeLanguage === language;
    return (
      <button
        aria-label={accessibleLabel}
        aria-pressed={active}
        className="language-switcher__button"
        key={language}
        onClick={() => setLanguage(language)}
        type="button"
      >
        {label}
      </button>
    );
  }

  return (
    <div aria-label={t('common.languageSelection')} className="language-switcher" role="group">
      {button('pl', 'PL', t('common.polish'))}
      {button('en', 'EN', t('common.english'))}
    </div>
  );
}
