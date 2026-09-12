import { useState } from 'react';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';
import type { LoanCalculationResult, LoanInput } from '../../types/loan';
import { useAuth } from '../auth/authContext';
import { analysisTitle, saveAnalysis } from './savedAnalysis';

interface SaveAnalysisButtonProps {
  input: LoanInput;
  onSaved: () => void;
  result: LoanCalculationResult;
}

export function SaveAnalysisButton({ input, onSaved, result }: SaveAnalysisButtonProps) {
  const { t } = useTranslation();
  const { isConfigured, isLoading, user } = useAuth();
  const [title, setTitle] = useState(() => analysisTitle());
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isConfigured) {
    return null;
  }

  if (isLoading) {
    return <p className="saved-analysis__status">{t('savedAnalyses.checkingSave')}</p>;
  }

  if (user === null) {
    return <p className="saved-analysis__status">{t('savedAnalyses.signInToSave')}</p>;
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      await saveAnalysis(title, input, result);
      setMessage(t('savedAnalyses.saved'));
      onSaved();
    } catch {
      setMessage(t('savedAnalyses.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="saved-analysis" aria-label={t('savedAnalyses.section')}>
      <label htmlFor="analysis-title">{t('savedAnalyses.title')}</label>
      <div className="saved-analysis__controls">
        <input
          id="analysis-title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? t('savedAnalyses.saving') : t('savedAnalyses.save')}
        </button>
      </div>
      {message === null ? null : (
        <p className="saved-analysis__status" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
