# eslint-plugin-acrocase

A single ESLint rule, `acrocase/acrocase`, that keeps acronyms uppercase in
identifiers.

**A**cronyms **C**onsistently **R**etain **O**riginal **Case**

```bash
npm install --save-dev eslint-plugin-acrocase
```

```js
// eslint.config.js
import acrocase from 'eslint-plugin-acrocase';

export default [
  { plugins: { acrocase }, rules: { 'acrocase/acrocase': ['error'] } },
];
```

One rule is not a set to curate, so there is no preset config: the line above
is the whole setup.

## What it does

The web platform keeps acronyms uppercase — `innerHTML`, `XMLDocument`,
`toJSON`, `encodeURIComponent` — and this rule holds your identifiers to the
same convention.

```js
const imageURL = 'https://example.com/img.png';
data.toJSON();
class HTTPClient {}

const imageUrl = '…'; // Acronym 'Url' should be 'URL'. Use 'imageURL'.
data.toJson(); //        Acronym 'Json' should be 'JSON'. Use 'toJSON'.
class HttpClient {} //   Acronym 'Http' should be 'HTTP'. Use 'HTTPClient'.
```

A leading acronym follows the casing of the identifier it starts, so `xmlDoc`
and `jsonData` are correct as written while `HtmlParser` is not.

Some abbreviations only look like acronyms. `Id` is short for "identifier", not
an initialism, so `userId` is correct and `userID` is reported.

Names declared somewhere else are never reported, because they are not yours to
choose: imported bindings, destructuring keys and computed keys.

## Report types

- **incorrectAcronym** — a known acronym appears in titlecase, like `Url` for
  `URL`.
- **incorrectException** — an abbreviation appears in uppercase, like `ID` for
  `Id`.

## Options

| Option     | Default | |
| ---------- | ------- | - |
| `acronyms` | `[]`    | Additional acronyms to enforce, on top of the dictionary. |

```js
// eslint.config.js
export default [
  {
    plugins: { acrocase },
    rules: { 'acrocase/acrocase': ['error', { acronyms: ['GCP', 'NATS'] }] },
  },
];
```

## Why there is no fix

Renaming an identifier is not a local edit. It means rewriting every reference
to it, and the references that decide whether the rename is safe are the ones a
linter cannot see: a named export is read by importers in other files, and a
property can be reached as `o.parseUrl` or `o['parseUrl']` from anywhere. A fix
that rewrote the declaration alone would produce code that still parses and no
longer works.

ESLint's own naming rules — `camelcase`, `id-match`, `id-denylist`,
`id-length` — report without fixing for the same reason. Renaming belongs to
your editor's rename refactor, which can see the whole project. The message
names the identifier to use.

## Dictionary

The plugin ships with a
[dictionary](https://github.com/bikeshaving/acrocase/blob/main/src/dictionary.json)
of 139 acronyms drawn from web platform APIs and general programming, along
with the exceptions — `Id`, `Intl` — that take normal casing despite looking
like acronyms.

## Requirements

ESLint 9 or later. The package is ESM-only; a CommonJS `eslint.config.cjs` can
still `require()` it on Node 20.19+ and 22.12+.

## License

MIT
