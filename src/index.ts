import type { Rule, ESLint } from 'eslint';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import dictionary from './dictionary.json' with { type: 'json' };

type MessageId = 'incorrectAcronym' | 'incorrectException';
type Options = [{ acronyms?: string[] }?];

/** An acronym and the miscased form to look for: URL, and Url. */
interface AcronymPattern {
  pattern: RegExp;
  acronym: string;
  titleCase: string;
}

/** An exception and the over-corrected form to look for: Id, and ID. */
interface ExceptionPattern {
  pattern: RegExp;
  incorrect: string;
  correct: string;
}

interface Violation {
  type: 'acronym' | 'exception';
  found: string;
  expected: string;
  index: number;
}

function buildAcronymPatterns(acronyms: string[]): AcronymPattern[] {
  const patterns: AcronymPattern[] = [];

  for (const acronym of acronyms) {
    const titleCase =
      acronym.charAt(0).toUpperCase() + acronym.slice(1).toLowerCase();
    if (titleCase !== acronym) {
      // The lookbehind accepts the start of the name as a boundary, which is
      // what catches PascalCase leading acronyms like HtmlParser. A lowercase
      // leading acronym (xmlDoc) never matches the titlecase form at all, so
      // camelCase names keep their lowercase first word.
      patterns.push({
        pattern: new RegExp(
          `(?<=^|[a-z])${titleCase}(?=[A-Z]|$|[^a-zA-Z])`,
          'g',
        ),
        acronym,
        titleCase,
      });
    }
  }

  return patterns;
}

function buildExceptionPatterns(exceptions: string[]): ExceptionPattern[] {
  const patterns: ExceptionPattern[] = [];

  for (const correct of exceptions) {
    const incorrect = correct.toUpperCase();
    if (incorrect !== correct) {
      patterns.push({
        pattern: new RegExp(`${incorrect}(?=[A-Z]|$|[^a-zA-Z])`, 'g'),
        incorrect,
        correct,
      });
    }
  }

  return patterns;
}

function checkIdentifier(
  name: string,
  acronymPatterns: AcronymPattern[],
  exceptionPatterns: ExceptionPattern[],
): Violation[] {
  const violations: Violation[] = [];

  for (const { pattern, acronym, titleCase } of acronymPatterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(name)) !== null) {
      violations.push({
        type: 'acronym',
        found: titleCase,
        expected: acronym,
        index: match.index,
      });
    }
  }

  for (const { pattern, incorrect, correct } of exceptionPatterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(name)) !== null) {
      violations.push({
        type: 'exception',
        found: incorrect,
        expected: correct,
        index: match.index,
      });
    }
  }

  return violations;
}

// Applied right to left so that an earlier replacement cannot shift the index
// of a later one.
function getCorrectedName(name: string, violations: Violation[]): string {
  let corrected = name;
  const sorted = [...violations].sort((a, b) => b.index - a.index);

  for (const violation of sorted) {
    const before = corrected.slice(0, violation.index);
    const after = corrected.slice(violation.index + violation.found.length);
    corrected = before + violation.expected + after;
  }

  return corrected;
}

const acrocase: TSESLint.RuleModule<MessageId, Options> = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Keep known acronyms uppercase in camelCase and PascalCase identifiers.',
      url: 'https://acrocase.org',
    },
    // Not fixable, and deliberately so. Renaming an identifier means rewriting
    // every reference to it, and the references that decide whether the rename
    // is safe are the ones a linter cannot see: importers in other files, and
    // property reads like `o['parseUrl']`. ESLint's own naming rules —
    // camelcase, id-match, id-denylist, id-length — report without fixing for
    // the same reason.
    schema: [
      {
        type: 'object',
        properties: {
          acronyms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional acronyms to enforce.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      incorrectAcronym:
        "Acronym '{{found}}' should be '{{expected}}' in '{{name}}'. Use '{{corrected}}' instead.",
      incorrectException:
        "'{{found}}' should be '{{expected}}' in '{{name}}'. Use '{{corrected}}' instead.",
    },
    defaultOptions: [{}],
  },
  defaultOptions: [{}],

  create(context) {
    const options = context.options[0] ?? {};

    // Deduplicated: naming an acronym the dictionary already carries is a
    // reasonable thing to do, and would otherwise build the same pattern
    // twice and report every match twice.
    const acronyms = [
      ...new Set([
        ...Object.keys(dictionary.acronyms),
        ...(options.acronyms ?? []),
      ]),
    ];

    const exceptions = Object.keys(dictionary.exceptions);
    const acronymPatterns = buildAcronymPatterns(acronyms);
    const exceptionPatterns = buildExceptionPatterns(exceptions);

    function check(node: TSESTree.Identifier) {
      const name = node.name;

      // An all-uppercase name is SCREAMING_SNAKE or a bare acronym, not
      // camelCase or PascalCase, so no casing rule here applies: VALID does
      // not contain the acronym ID.
      if (name === name.toUpperCase()) {
        return;
      }

      const violations = checkIdentifier(
        name,
        acronymPatterns,
        exceptionPatterns,
      );

      if (violations.length === 0) {
        return;
      }

      const corrected = getCorrectedName(name, violations);

      for (const violation of violations) {
        context.report({
          node,
          messageId:
            violation.type === 'exception'
              ? 'incorrectException'
              : 'incorrectAcronym',
          data: {
            found: violation.found,
            expected: violation.expected,
            name,
            corrected,
          },
        });
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          check(node.id);
        }
      },

      'FunctionDeclaration, FunctionExpression'(
        node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
      ) {
        if (node.id) {
          check(node.id);
        }
      },

      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(
        node: TSESTree.FunctionLike,
      ) {
        for (const param of node.params) {
          if (param.type === 'Identifier') {
            check(param);
          }
        }
      },

      ClassDeclaration(node) {
        if (node.id) {
          check(node.id);
        }
      },

      // A shorthand key is really a reference to a binding declared elsewhere,
      // and a destructuring key names a property someone else declared. Both
      // are somebody else's name to choose, so neither is reported.
      'Property > Identifier.key'(node: TSESTree.Identifier) {
        const property = node.parent as TSESTree.Property;
        if (
          property.computed ||
          property.shorthand ||
          property.parent.type === 'ObjectPattern'
        ) {
          return;
        }
        check(node);
      },

      'MethodDefinition > Identifier.key'(node: TSESTree.Identifier) {
        if (!(node.parent as TSESTree.MethodDefinition).computed) {
          check(node);
        }
      },

      'PropertyDefinition > Identifier.key'(node: TSESTree.Identifier) {
        if (!(node.parent as TSESTree.PropertyDefinition).computed) {
          check(node);
        }
      },

      TSInterfaceDeclaration(node) {
        check(node.id);
      },

      TSTypeAliasDeclaration(node) {
        check(node.id);
      },

      'TSPropertySignature > Identifier.key'(node: TSESTree.Identifier) {
        if (!(node.parent as TSESTree.TSPropertySignature).computed) {
          check(node);
        }
      },
    };
  },
};

// ESLint types rules against ESTree; this one is typed against TSESTree so it
// can walk TypeScript nodes. The shapes are identical at runtime.
//
// No `configs`. One rule is not a set to curate, so a preset would save only
// the line that registers the plugin.
const plugin: ESLint.Plugin = {
  rules: { acrocase: acrocase as unknown as Rule.RuleModule },
};

export default plugin;
