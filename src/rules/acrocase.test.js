const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("./acrocase.js");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module",
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
  ],
  invalid: [
    // interior acronyms (previously caught; still caught)
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
    {
      code: "class Foo { toXml() {} }",
      output: "class Foo { toXML() {} }",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // leading PascalCase acronyms (regression: previously missed)
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
    // class fields (regression: PropertyDefinition visitor was missing)
    {
      code: "class Foo { apiUrl = ''; }",
      output: "class Foo { apiURL = ''; }",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // leading acronym in a class field name
    {
      code: "class Foo { HtmlContent = ''; }",
      output: "class Foo { HTMLContent = ''; }",
      errors: [{ messageId: "incorrectAcronym" }],
    },
    // exceptions still flagged
    {
      code: "const getUserID = null;",
      output: "const getUserId = null;",
      errors: [{ messageId: "incorrectException" }],
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
  ],
});

console.log("acrocase rule tests passed");
