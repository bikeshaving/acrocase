# eslint-plugin-acrocase

ESLint plugin to enforce [ACROCase](https://acrocase.org) naming conventions.

**A**cronyms **C**onsistently **R**etain **O**riginal **Case**

## Installation

```bash
npm install eslint-plugin-acrocase --save-dev
```

## Usage

In `eslint.config.js`:

```js
import acrocase from "eslint-plugin-acrocase";

export default [
  {
    plugins: {acrocase},
    rules: {
      "acrocase/acrocase": "error",
    },
  },
];
```

Or spread the recommended config, which does the same thing in one line:

```js
import acrocase from "eslint-plugin-acrocase";

export default [acrocase.configs.recommended];
```

The package is ESM-only. A CommonJS `eslint.config.cjs` can still `require()`
it on Node 20.19+ and 22.12+.

## What it does

The rule enforces that known acronyms retain their uppercase form in camelCase and PascalCase identifiers. It also catches abbreviations that are commonly mistaken for acronyms (like `ID` instead of `Id`).

### Correct

```js
const imageURL = "https://example.com/img.png";
const userId = 12345;
element.innerHTML = "<p>Hello</p>";
data.toJSON();

class HTTPClient {}
class APIResponse {}
```

### Incorrect

```js
const imageUrl = "https://example.com/img.png";  // imageURL
const userID = 12345;                             // userId
data.toJson();                                    // toJSON

class HttpClient {}   // HTTPClient
class ApiResponse {}  // APIResponse
```

## Options

### `acronyms`

Add project-specific acronyms on top of the built-in dictionary:

```js
{
  rules: {
    "acrocase/acrocase": ["error", {acronyms: ["GCP", "NATS"]}],
  },
}
```

## Why there is no auto-fix

The rule reports violations and leaves your code alone. It is not fixable, and
that is deliberate.

Renaming an identifier is not a local edit. It means rewriting every reference
to it, and the references that matter most are the ones a linter cannot see: a
named export is read by importers in other files, and a property can be reached
as `o.parseUrl` or `o["parseUrl"]` from anywhere. An autofix that rewrote the
declaration alone would produce code that still parses and no longer works.

This follows ESLint's own naming rules. `camelcase`, `id-match`, `id-denylist`
and `id-length` are all report-only for the same reason. Renaming is a job for
your editor's rename refactor, which can see the whole project; the rule's
message tells you the name to use.

Names that belong to someone else are not reported at all: imported bindings,
destructuring keys and computed keys.

## Dictionary

The plugin ships with a [dictionary](https://github.com/bikeshaving/acrocase/blob/main/src/dictionary.ts) of common acronyms sourced from web platform APIs and general programming. It includes exceptions for abbreviations like `Id` and `Intl` that follow normal casing despite looking like acronyms.

## License

MIT
