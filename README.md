# eslint-plugin-acrocase

ESLint plugin to enforce [ACROCase](https://acrocase.org) naming conventions.

**A**cronyms **C**onsistently **R**etain **O**riginal **Case**

## Installation

```bash
npm install eslint-plugin-acrocase --save-dev
```

## Usage

```json
{
  "plugins": ["acrocase"],
  "rules": {
    "acrocase/acrocase": "error"
  }
}
```

Or use the recommended config:

```json
{
  "extends": ["plugin:acrocase/recommended"]
}
```

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

```json
{
  "acrocase/acrocase": ["error", {
    "acronyms": ["GCP", "NATS"]
  }]
}
```

## Auto-fix

Run `eslint --fix` to correct violations automatically. A fix renames the
declaration together with every reference to it, so call sites, JSX tags and
type annotations stay in sync, and shadowed bindings are each renamed only
within their own scope.

Two kinds of name are reported but never rewritten automatically, because the
references that would need to change are not visible to the rule:

- **Named exports.** Importers live in other files, so renaming one would break
  them silently. These are reported as errors with no fix and no suggestion.
  A default export is still fixed, since importers pick their own local name.
- **Properties and methods.** A property can be read as `o.parseUrl` or
  `o["parseUrl"]` from anywhere, so the rename is offered as an editor
  suggestion you apply deliberately rather than as an autofix.

Imported names, destructuring keys and computed keys are left alone entirely,
since those names belong to whoever declared them.

## Dictionary

The plugin ships with a [dictionary](https://github.com/brainkim/acrocase/blob/main/dictionary.json) of common acronyms sourced from web platform APIs and general programming. It includes exceptions for abbreviations like `Id` and `Intl` that follow normal casing despite looking like acronyms.

## License

MIT
