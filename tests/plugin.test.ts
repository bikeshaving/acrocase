import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { test, expect } from '@b9g/libuild/test';
import acrocase from '../src/index.js';

const config = [
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { acrocase },
    rules: { 'acrocase/acrocase': 'error' },
  },
] as Linter.Config[];

test('the plugin registers and reports under a flat config', () => {
  const linter = new Linter();
  const messages = linter.verify('const parseUrl = 1;', config, 't.tsx');

  expect(messages.length).toBe(1);
  expect(messages[0]!.messageId).toBe('incorrectAcronym');
  expect(messages[0]!.message).toBe(
    "Acronym 'Url' should be 'URL' in 'parseUrl'. Use 'parseURL' instead.",
  );
});

test('the plugin exposes exactly one rule and no presets', () => {
  expect(Object.keys(acrocase.rules ?? {})).toEqual(['acrocase']);
  expect(acrocase.configs).toBeUndefined();
});

// The rule renames nothing, so nothing it reports may carry a fix or a
// suggestion. A fix would have to rewrite every reference, including those in
// files ESLint never sees.
test('nothing reported is rewritable', () => {
  const linter = new Linter();
  const rule = acrocase.rules!.acrocase!;

  expect(rule.meta?.fixable).toBeUndefined();
  expect(rule.meta?.hasSuggestions).toBeUndefined();

  const samples = [
    'const parseUrl = 1;\nparseUrl();',
    'class HtmlParser {}\nnew HtmlParser();',
    'export function parseUrl() {}',
    'const o = { parseUrl: 1 };',
    'function f(apiUrl: string) { return apiUrl; }',
  ];

  for (const code of samples) {
    const messages = linter.verify(code, config, 't.tsx');
    expect(messages.length > 0).toBe(true);
    for (const message of messages) {
      expect(message.fix).toBeUndefined();
      expect(message.suggestions ?? []).toEqual([]);
    }
    expect(linter.verifyAndFix(code, config, 't.tsx').output).toBe(code);
  }
});
