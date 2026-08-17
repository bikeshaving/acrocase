const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("./acrocase.js");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const acronym = { messageId: "incorrectAcronym" };
const exception = { messageId: "incorrectException" };

ruleTester.run("acrocase", rule, {
  valid: [
    // camelCase leading acronyms stay lowercase
    "const xmlDoc = null;",
    "const jsonData = {};",
    "function urlParser() {}",
    // correctly cased ACROCase
    "function parseURL() {}",
    "const toJSON = () => {};",
    "class HTMLParser {}",
    "interface HTTPOptions { parseURL: string; }",
    "type URLLike = string;",
    "class Foo { apiURL = ''; toXML() {} }",
    // exceptions correctly cased
    "const userId = 1;",
    "class Foo { getUserId() {} }",
    // names we do not own: imports, destructuring keys, computed keys
    "import { parseUrl } from './m';\nparseUrl();",
    "const { parseUrl } = obj;",
    "const { toJson: local } = obj;",
    "const o = { [parseUrl]: 1 };",
  ],
  invalid: [
    // interior acronyms
    { code: "const parseUrl = null;", errors: [acronym] },
    { code: "const toJson = () => {};", errors: [acronym] },
    { code: "function parseHtml() {}", errors: [acronym] },
    { code: "class Foo { toXml() {} }", errors: [acronym] },

    // leading acronyms (regression: previously missed entirely)
    { code: "class HtmlParser {}", errors: [acronym] },
    { code: "interface HttpOptions { port: number; }", errors: [acronym] },
    { code: "type UrlLike = string;", errors: [acronym] },
    { code: "const Url = null;", errors: [acronym] },
    { code: "class HtmlToXmlConverter {}", errors: [acronym, acronym] },

    // class fields (regression: PropertyDefinition visitor was missing)
    { code: "class Foo { apiUrl = ''; }", errors: [acronym] },
    { code: "class Foo { HtmlContent = ''; }", errors: [acronym] },

    // other declaration and member positions
    { code: "function f(apiUrl: string) { return apiUrl; }", errors: [acronym] },
    { code: "const o = { parseUrl: 1 };", errors: [acronym] },
    { code: "interface O { parseUrl: string }", errors: [acronym] },
    { code: "const HtmlBox = () => null;", errors: [acronym] },

    // exported names are still reported, they just cannot be rewritten
    { code: "export function parseUrl() {}", errors: [acronym] },
    { code: "export const apiUrl = 1;", errors: [acronym] },
    { code: "export class HtmlParser {}", errors: [acronym] },
    { code: "export interface HttpOptions { p: number }", errors: [acronym] },
    { code: "export default class HtmlParser {}", errors: [acronym] },

    // exceptions: ID is not an acronym, it should be Id
    { code: "const getUserID = null;", errors: [exception] },
  ],
});

// The rule must not offer a fix or a suggestion for anything it reports.
const { Linter } = require("eslint");
const assert = require("assert");

const linter = new Linter();
const config = [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { acrocase: { rules: { acrocase: rule } } },
    rules: { "acrocase/acrocase": "error" },
  },
];

assert.ok(!rule.meta.fixable, "rule must not declare itself fixable");
assert.ok(!rule.meta.hasSuggestions, "rule must not declare suggestions");

const samples = [
  "const parseUrl = 1;\nparseUrl();",
  "class HtmlParser {}\nnew HtmlParser();",
  "export function parseUrl() {}",
  "const o = { parseUrl: 1 };",
  "function f(apiUrl: string) { return apiUrl; }",
];

for (const code of samples) {
  const messages = linter.verify(code, config, "t.tsx");
  assert.ok(messages.length > 0, `expected a report for:\n${code}`);
  for (const message of messages) {
    assert.ok(!message.fix, `unexpected fix for:\n${code}`);
    assert.ok(
      !message.suggestions || message.suggestions.length === 0,
      `unexpected suggestion for:\n${code}`,
    );
  }
  // Source is left byte-for-byte alone by --fix.
  assert.strictEqual(linter.verifyAndFix(code, config, "t.tsx").output, code);
}

console.log("acrocase rule tests passed");
