import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useCallback, useEffect, useRef } from 'react';
import { pushCodeChange } from '../services/websocket';
import { useAppDispatch, useAppSelector } from '../hooks/store';
import type { RootState } from '@/store';
import {
  clearSuggestion,
  fetchAutocomplete,
  setCode,
  setCursorPosition
} from '../store/roomSlice';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const CodeEditor = () => {
  const dispatch = useAppDispatch();
  const { code, cursorPosition, username, roomId, status } = useAppSelector(
    (state: RootState) => state.room
  );
  const debouncedCode = useDebouncedValue(code, 600);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleChange = useCallback(
    (value?: string) => {
      const nextValue = value ?? '';
      dispatch(setCode(nextValue));
      dispatch(clearSuggestion());
      if (roomId) {
        pushCodeChange({ code: nextValue, cursorPosition, username, roomId });
      }
    },
    [cursorPosition, dispatch, username, roomId]
  );

  const handleMount: NonNullable<Parameters<typeof Editor>[0]['onMount']> = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;
    monaco.editor.setTheme('vs-dark');
    editor.focus();

    const disposable = editor.onDidChangeCursorPosition(() => {
      const model = editor.getModel();
      if (!model) {
        return;
      }
      const position = editor.getPosition();
      if (!position) {
        return;
      }
      const offset = model.getOffsetAt(position);
      dispatch(setCursorPosition(offset));
    });

    editor.onDidDispose(() => disposable.dispose());
  };

  useEffect(() => {
    if (!roomId || !debouncedCode.trim()) {
      dispatch(clearSuggestion());
      return;
    }
    dispatch(
      fetchAutocomplete({
        code: debouncedCode,
        cursorPosition,
        language: 'python'
      })
    );
  }, [debouncedCode, cursorPosition, dispatch, roomId]);

  return (
    <div className="editor-wrapper" data-status={status}>
      <Editor
        height="100%"
        defaultLanguage="python"
        defaultValue={code}
        value={code}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontLigatures: true,
          scrollbar: { verticalScrollbarSize: 6 },
          theme: 'vs-dark',
          automaticLayout: true
        }}
      />
    </div>
  );
};

export default CodeEditor;
