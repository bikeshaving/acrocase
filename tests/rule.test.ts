import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { test } from '@b9g/libuild/test';
import acrocase from '../src/index.js';

// Both hooks run their callback directly rather than opening a subtest.
// RuleTester nests `describe('valid')` inside `describe(ruleName)`, so mapping
// `describe` onto a test function produces a test inside a test: the outer
// callback returns before the inner one finishes and node cancels it.
RuleTester.describe = (_name: string, fn: () => void) => fn();
RuleTester.it = (_name: string, fn: () => void) => fn();

// Identifiers appear in type positions and class bodies, so the whole suite
// runs under the TypeScript parser rather than testing TS syntax separately.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const rule = acrocase.rules!.acrocase!;
const acronym = { messageId: 'incorrectAcronym' };
const exception = { messageId: 'incorrectException' };

test('reports miscased acronyms through the rule API', () => {
  ruleTester.run('acrocase', rule, {
    valid: [
      // A leading acronym in camelCase is lowercase by definition, so these
      // are correct as written and must never be reported.
      'const xmlDoc = null;',
      'const jsonData = {};',
      'function urlParser() {}',

      'function parseURL() {}',
      'const toJSON = () => {};',
      'class HTMLParser {}',
      'interface HTTPOptions { parseURL: string; }',
      'type URLLike = string;',
      "class Foo { apiURL = ''; toXML() {} }",

      // Id is an exception: the lowercase form is the correct one.
      'const userId = 1;',
      'class Foo { getUserId() {} }',

      // Names declared elsewhere are not ours to judge.
      "import { parseUrl } from './m';\nparseUrl();",
      'const { parseUrl } = obj;',
      'const { toJson: local } = obj;',
      'const o = { [parseUrl]: 1 };',
    ],
    invalid: [
      { code: 'const parseUrl = null;', errors: [acronym] },
      { code: 'const toJson = () => {};', errors: [acronym] },
      { code: 'function parseHtml() {}', errors: [acronym] },
      { code: 'class Foo { toXml() {} }', errors: [acronym] },

      // A leading acronym in PascalCase went undetected until the pattern
      // learned to treat the start of a name as a word boundary.
      { code: 'class HtmlParser {}', errors: [acronym] },
      { code: 'interface HttpOptions { port: number; }', errors: [acronym] },
      { code: 'type UrlLike = string;', errors: [acronym] },
      { code: 'const Url = null;', errors: [acronym] },
      { code: 'class HtmlToXmlConverter {}', errors: [acronym, acronym] },

      // Class fields had no visitor at all.
      { code: "class Foo { apiUrl = ''; }", errors: [acronym] },
      { code: "class Foo { HtmlContent = ''; }", errors: [acronym] },

      {
        code: 'function f(apiUrl: string) { return apiUrl; }',
        errors: [acronym],
      },
      { code: 'const o = { parseUrl: 1 };', errors: [acronym] },
      { code: 'interface O { parseUrl: string }', errors: [acronym] },
      { code: 'const HtmlBox = () => null;', errors: [acronym] },

      // An exported name is reported like any other. Only a fix would have
      // had to care that importers live in other files.
      { code: 'export function parseUrl() {}', errors: [acronym] },
      { code: 'export const apiUrl = 1;', errors: [acronym] },
      { code: 'export class HtmlParser {}', errors: [acronym] },
      {
        code: 'export interface HttpOptions { p: number }',
        errors: [acronym],
      },
      { code: 'export default class HtmlParser {}', errors: [acronym] },

      // ID reads as an initialism but abbreviates "identifier".
      { code: 'const getUserID = null;', errors: [exception] },
    ],
  });
});

test('accepts project acronyms on top of the dictionary', () => {
  ruleTester.run('acrocase', rule, {
    valid: [
      // Unknown to the dictionary and not configured here.
      { code: 'const natsQueue = 1;' },
      { code: 'const parseNats = 1;' },
    ],
    invalid: [
      {
        code: 'const parseNats = 1;',
        options: [{ acronyms: ['NATS'] }],
        errors: [acronym],
      },
      // Naming an acronym the dictionary already carries must not report it
      // twice.
      {
        code: 'const parseGcp = 1;',
        options: [{ acronyms: ['GCP'] }],
        errors: [acronym],
      },
    ],
  });
});
