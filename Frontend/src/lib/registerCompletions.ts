import type * as Monaco from 'monaco-editor';

type SuggestionSeed = {
  label: string;
  insertText: string;
  kind: 'keyword' | 'function' | 'snippet';
};

type CompletionRegistry = Record<string, SuggestionSeed[]>;

const registry: CompletionRegistry = {
  python: [
    {
      label: 'def',
      insertText: 'def ${1:function_name}():\n    $0',
      kind: 'keyword'
    },
    {
      label: 'print',
      insertText: 'print(${1:value})',
      kind: 'function'
    },
    {
      label: 'if __name__ == "__main__":',
      insertText: 'if __name__ == "__main__":\n    ${1:main()}$0',
      kind: 'snippet'
    }
  ]
};

const resolveKind = (
  monaco: typeof import('monaco-editor'),
  seedKind: SuggestionSeed['kind']
): Monaco.languages.CompletionItemKind => {
  switch (seedKind) {
    case 'function':
      return monaco.languages.CompletionItemKind.Function;
    case 'snippet':
      return monaco.languages.CompletionItemKind.Snippet;
    default:
      return monaco.languages.CompletionItemKind.Keyword;
  }
};

export const registerCompletions = (
  monaco: typeof import('monaco-editor'),
  languageId: keyof typeof registry
): Monaco.IDisposable | null => {
  const seeds = registry[languageId];
  if (!seeds?.length) {
    return null;
  }

  return monaco.languages.registerCompletionItemProvider(languageId, {
    provideCompletionItems: (_, position) => {
      const range = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );

      return {
        suggestions: seeds.map(seed => ({
          label: seed.label,
          insertText: seed.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          kind: resolveKind(monaco, seed.kind),
          range
        }))
      };
    }
  });
};

export const registerLanguageSuggestions = (
  languageId: keyof typeof registry,
  seeds: SuggestionSeed[]
) => {
  registry[languageId] = seeds;
};