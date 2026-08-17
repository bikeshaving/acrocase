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
    {
      code: "const parseUrl = null;",
      output: "const parseURL = null;",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "const toJson = () => {};",
      output: "const toJSON = () => {};",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "function parseHtml() {}",
      output: "function parseHTML() {}",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // leading PascalCase acronyms (regression: previously missed entirely)
    {
      code: "class HtmlParser {}",
      output: "class HTMLParser {}",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "interface HttpOptions { port: number; }",
      output: "interface HTTPOptions { port: number; }",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "type UrlLike = string;",
      output: "type URLLike = string;",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "const Url = null;",
      output: "const URL = null;",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // multiple violations in one name, including leading position
    {
      code: "class HtmlToXmlConverter {}",
      output: "class HTMLToXMLConverter {}",
      errors: [
        { messageId: "incorrectAcronym" },
        { messageId: "incorrectAcronym" },
      ],
    },

    // The fix renames references, not just the declaration.
    {
      code: "function parseUrl(s) { return s; }\nparseUrl('x');",
      output: "function parseURL(s) { return s; }\nparseURL('x');",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "const HtmlBox = () => null;\nconst el = <HtmlBox />;",
      output: "const HTMLBox = () => null;\nconst el = <HTMLBox />;",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "type UrlLike = string;\nconst x: UrlLike = 'a';",
      output: "type URLLike = string;\nconst x: URLLike = 'a';",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "interface HttpOptions { p: number }\nfunction g(o: HttpOptions) {}",
      output: "interface HTTPOptions { p: number }\nfunction g(o: HTTPOptions) {}",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    {
      code: "class HtmlParser {}\nnew HtmlParser();",
      output: "class HTMLParser {}\nnew HTMLParser();",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // Each shadowed binding renames only its own scope. The outer binding's
    // fix spans the inner one, so a single pass applies just the outer rename;
    // the convergence check below covers the multi-pass result.
    {
      code: "const apiUrl = 1;\nfunction f() { const apiUrl = 2; return apiUrl; }\nconsole.log(apiUrl);",
      output:
        "const apiURL = 1;\nfunction f() { const apiUrl = 2; return apiUrl; }\nconsole.log(apiURL);",
      errors: [
        { messageId: "incorrectAcronym" },
        { messageId: "incorrectAcronym" },
      ],
    },
    // shorthand expands so the property key keeps its original name
    {
      code: "const parseUrl = 1;\nconst o = { parseUrl };",
      output: "const parseURL = 1;\nconst o = { parseUrl: parseURL };",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // a default export's local name is private, so it is still fixable
    {
      code: "export default class HtmlParser {}",
      output: "export default class HTMLParser {}",
      errors: [{ messageId: "incorrectAcronym" }],
    },

    // Named exports are the module's public API: report only, never rewrite.
    {
      code: "export function parseUrl() {}\nparseUrl();",
      output: null,
      errors: [{ messageId: "incorrectAcronym", suggestions: [] }],
    },
    {
      code: "export const apiUrl = 1;",
      output: null,
      errors: [{ messageId: "incorrectAcronym", suggestions: [] }],
    },
    {
      code: "const apiUrl = 1;\nexport { apiUrl };",
      output: null,
      errors: [{ messageId: "incorrectAcronym", suggestions: [] }],
    },
    {
      code: "export class HtmlParser {}",
      output: null,
      errors: [{ messageId: "incorrectAcronym", suggestions: [] }],
    },
    {
      code: "export interface HttpOptions { p: number }",
      output: null,
      errors: [{ messageId: "incorrectAcronym", suggestions: [] }],
    },

    // Members have references we cannot resolve: suggestion, never an autofix.
    {
      code: "const o = { parseUrl: 1 };\nconsole.log(o.parseUrl);",
      output: null,
      errors: [
        {
          messageId: "incorrectAcronym",
          suggestions: [
            {
              messageId: "renameMember",
              output: "const o = { parseURL: 1 };\nconsole.log(o.parseUrl);",
            },
          ],
        },
      ],
    },
    {
      code: "class A { toXml() {} }\nnew A().toXml();",
      output: null,
      errors: [
        {
          messageId: "incorrectAcronym",
          suggestions: [
            {
              messageId: "renameMember",
              output: "class A { toXML() {} }\nnew A().toXml();",
            },
          ],
        },
      ],
    },
    // class fields (regression: PropertyDefinition visitor was missing)
    {
      code: "class Foo { apiUrl = ''; }",
      output: null,
      errors: [
        {
          messageId: "incorrectAcronym",
          suggestions: [
            { messageId: "renameMember", output: "class Foo { apiURL = ''; }" },
          ],
        },
      ],
    },
    {
      code: "class Foo { HtmlContent = ''; }",
      output: null,
      errors: [
        {
          messageId: "incorrectAcronym",
          suggestions: [
            {
              messageId: "renameMember",
              output: "class Foo { HTMLContent = ''; }",
            },
          ],
        },
      ],
    },
    {
      code: "interface O { parseUrl: string }",
      output: null,
      errors: [
        {
          messageId: "incorrectAcronym",
          suggestions: [
            {
              messageId: "renameMember",
              output: "interface O { parseURL: string }",
            },
          ],
        },
      ],
    },

    // exceptions: ID is not an acronym, it should be Id
    {
      code: "const getUserID = null;",
      output: "const getUserId = null;",
      errors: [{ messageId: "incorrectException" }],
    },
  ],
});

// RuleTester applies one fix pass. `eslint --fix` runs up to ten, so these
// check what the user actually ends up with, and that fixing converges to code
// with no dangling references.
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

const convergence = [
  [
    "const apiUrl = 1;\nfunction f() { const apiUrl = 2; return apiUrl; }\nconsole.log(apiUrl);",
    "const apiURL = 1;\nfunction f() { const apiURL = 2; return apiURL; }\nconsole.log(apiURL);",
  ],
  [
    "class HtmlToXmlConverter {}\nnew HtmlToXmlConverter();",
    "class HTMLToXMLConverter {}\nnew HTMLToXMLConverter();",
  ],
  [
    "function parseUrl(s) { return s; }\nconst toJson = () => parseUrl('x');",
    "function parseURL(s) { return s; }\nconst toJSON = () => parseURL('x');",
  ],
];

for (const [input, expected] of convergence) {
  const { output } = linter.verifyAndFix(input, config, "t.tsx");
  assert.strictEqual(output, expected, `did not converge for:\n${input}`);
  assert.strictEqual(
    linter.verify(output, config, "t.tsx").length,
    0,
    `fixed output still reports violations:\n${output}`,
  );
}

console.log("acrocase rule tests passed");
