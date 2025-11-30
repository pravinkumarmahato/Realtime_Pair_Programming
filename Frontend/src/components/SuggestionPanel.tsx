import { useAppSelector } from '../hooks/store';
import type { RootState } from '@/store';

const SuggestionPanel = () => {
  const { suggestion } = useAppSelector((state: RootState) => state.room);

  if (!suggestion.text && !suggestion.isLoading) {
    return null;
  }

  return (
    <div className="suggestion-panel">
      <div className="suggestion-header">
        <span>AI hint</span>
        {suggestion.isLoading && <span className="suggestion-status">Thinking…</span>}
        {!suggestion.isLoading && suggestion.text && (
          <span className="suggestion-status positive">Ready</span>
        )}
      </div>
      <pre className="suggestion-body">{suggestion.text || 'Waiting for signal...'}</pre>
    </div>
  );
};

export default SuggestionPanel;
