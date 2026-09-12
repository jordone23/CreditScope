import { useTranslation } from 'react-i18next';

export function EducationalDisclaimer() {
  const { t } = useTranslation();

  return (
    <footer className="disclaimer">
      <div className="content-container disclaimer__content">
        <p>
          <strong>{t('disclaimer.important')}</strong> {t('disclaimer.content')}
        </p>
      </div>
    </footer>
  );
}
