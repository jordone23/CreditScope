import { useState } from 'react';
import type { LoanCalculationResult, LoanInput } from '../../types/loan';
import { useAuth } from '../auth/authContext';
import { analysisTitle, saveAnalysis } from './savedAnalysis';

interface SaveAnalysisButtonProps {
  input: LoanInput;
  onSaved: () => void;
  result: LoanCalculationResult;
}

export function SaveAnalysisButton({ input, onSaved, result }: SaveAnalysisButtonProps) {
  const { isConfigured, isLoading, user } = useAuth();
  const [title, setTitle] = useState(() => analysisTitle());
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isConfigured) {
    return null;
  }

  if (isLoading) {
    return <p className="saved-analysis__status">Sprawdzanie możliwości zapisu…</p>;
  }

  if (user === null) {
    return (
      <p className="saved-analysis__status">Zaloguj się, aby zapisać tę analizę na swoim koncie.</p>
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);
    try {
      await saveAnalysis(title, input, result);
      setMessage('Analiza została zapisana.');
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nie udało się zapisać analizy.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="saved-analysis" aria-label="Zapis analizy">
      <label htmlFor="analysis-title">Nazwa zapisywanej analizy</label>
      <div className="saved-analysis__controls">
        <input
          id="analysis-title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'Zapisywanie…' : 'Zapisz analizę'}
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
