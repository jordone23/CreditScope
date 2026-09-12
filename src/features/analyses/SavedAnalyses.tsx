import { useEffect, useState } from 'react';
import '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { formatCurrencyPLN } from '../../lib/formatters';
import { useAuth } from '../auth/authContext';
import {
  deleteSavedAnalysis,
  getSavedAnalyses,
  getSavedAnalysis,
  type SavedAnalysis,
  type SavedAnalysisSummary,
} from './savedAnalysis';

interface SavedAnalysesProps {
  onOpen: (analysis: SavedAnalysis) => void;
  refreshKey: number;
}

export function SavedAnalyses({ onOpen, refreshKey }: SavedAnalysesProps) {
  const { t } = useTranslation();
  const { isConfigured, user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysisSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured || user === null) {
      setAnalyses([]);
      return;
    }

    let isMounted = true;
    void getSavedAnalyses()
      .then((items) => {
        if (isMounted) {
          setAnalyses(items);
          setMessage(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage(t('savedAnalyses.fetchError'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isConfigured, refreshKey, t, user]);

  if (!isConfigured || user === null) {
    return null;
  }

  async function handleDelete(id: string) {
    try {
      await deleteSavedAnalysis(id);
      setAnalyses((current) => current.filter((analysis) => analysis.id !== id));
    } catch {
      setMessage(t('savedAnalyses.deleteError'));
    }
  }

  async function handleOpen(id: string) {
    setMessage(null);
    try {
      onOpen(await getSavedAnalysis(id));
    } catch {
      setMessage(t('savedAnalyses.openError'));
    }
  }

  return (
    <section className="saved-analyses" aria-labelledby="saved-analyses-heading">
      <h2 id="saved-analyses-heading">{t('savedAnalyses.heading')}</h2>
      {message === null ? null : (
        <p className="saved-analysis__status" role="alert">
          {message}
        </p>
      )}
      {analyses.length === 0 ? (
        <p>{t('savedAnalyses.empty')}</p>
      ) : (
        <ul>
          {analyses.map((analysis) => (
            <li key={analysis.id}>
              <button
                type="button"
                className="saved-analyses__open"
                onClick={() => void handleOpen(analysis.id)}
              >
                <strong>{analysis.title}</strong>
                <span>
                  {t('savedAnalyses.monthlyInstallment', {
                    amount: formatCurrencyPLN(analysis.monthlyInstallment),
                  })}
                </span>
              </button>
              <button
                type="button"
                className="saved-analyses__delete"
                onClick={() => void handleDelete(analysis.id)}
              >
                {t('savedAnalyses.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
