import { useEffect, useState } from 'react';
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
      .catch((error: unknown) => {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : 'Nie udało się pobrać analiz.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isConfigured, refreshKey, user]);

  if (!isConfigured || user === null) {
    return null;
  }

  async function handleDelete(id: string) {
    try {
      await deleteSavedAnalysis(id);
      setAnalyses((current) => current.filter((analysis) => analysis.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się usunąć analizy.');
    }
  }

  async function handleOpen(id: string) {
    setMessage(null);
    try {
      onOpen(await getSavedAnalysis(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się otworzyć analizy.');
    }
  }

  return (
    <section className="saved-analyses" aria-labelledby="saved-analyses-heading">
      <h2 id="saved-analyses-heading">Zapisane analizy</h2>
      {message === null ? null : (
        <p className="saved-analysis__status" role="alert">
          {message}
        </p>
      )}
      {analyses.length === 0 ? (
        <p>Nie masz jeszcze zapisanych analiz.</p>
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
                <span>{formatCurrencyPLN(analysis.monthlyInstallment)} miesięcznej raty</span>
              </button>
              <button
                type="button"
                className="saved-analyses__delete"
                onClick={() => void handleDelete(analysis.id)}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
