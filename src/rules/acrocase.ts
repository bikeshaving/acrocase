/**
 * @fileoverview Enforce ACROCase naming conventions for acronyms
 */

import type {Rule} from "eslint";
import type * as ESTree from "estree";
import dictionary from "../dictionary.ts";

interface AcronymPattern {
  pattern: RegExp;
  acronym: string;
  titleCase: string;
}

interface ExceptionPattern {
  pattern: RegExp;
  incorrect: string;
  correct: string;
}

interface Violation {
  type: "acronym" | "exception";
  found: string;
  expected: string;
  index: number;
}

// Build regex patterns for detecting incorrectly cased acronyms.
// For each acronym like "URL", detect the titlecase form "Url".
function buildAcronymPatterns(acronyms: string[]): AcronymPattern[] {
  const patterns: AcronymPattern[] = [];

  for (const acronym of acronyms) {
    const titleCase = acronym.charAt(0).toUpperCase() + acronym.slice(1).toLowerCase();
    if (titleCase !== acronym) {
      // Titlecase at the start of a name is PascalCase (HtmlParser); a
      // lowercase leading acronym (xmlDoc) never matches the titlecase form.
      patterns.push({
        pattern: new RegExp(`(?<=^|[a-z])${titleCase}(?=[A-Z]|$|[^a-zA-Z])`, "g"),
        acronym,
        titleCase,
      });
    }
  }

  return patterns;
}

// Build regex patterns for detecting exception violations.
// For each exception like "Id", detect the all-caps form "ID".
function buildExceptionPatterns(exceptions: string[]): ExceptionPattern[] {
  const patterns: ExceptionPattern[] = [];

  for (const correct of exceptions) {
    const incorrect = correct.toUpperCase();
    if (incorrect !== correct) {
      patterns.push({
        pattern: new RegExp(`${incorrect}(?=[A-Z]|$|[^a-zA-Z])`, "g"),
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
        type: "acronym",
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
        type: "exception",
        found: incorrect,
        expected: correct,
        index: match.index,
      });
    }
  }

  return violations;
}

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

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce ACROCase naming conventions for acronyms",
      recommended: true,
      url: "https://acrocase.org",
    },
    // Not fixable, and deliberately so. Renaming an identifier means rewriting
    // every reference to it, and the ones that matter most are the ones ESLint
    // cannot see: importers in other files, and property reads like
    // `o["parseUrl"]`. ESLint's own naming rules (camelcase, id-match,
    // id-denylist, id-length) all report without fixing, for the same reason.
    schema: [
      {
        type: "object",
        properties: {
          acronyms: {
            type: "array",
            items: { type: "string" },
            description: "Additional acronyms to enforce",
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
  },

  create(context: Rule.RuleContext) {
    const options: {acronyms?: string[]} = context.options[0] || {};

    const acronyms = Object.keys(dictionary.acronyms);
    if (options.acronyms) {
      acronyms.push(...options.acronyms);
    }

    const exceptions = Object.keys(dictionary.exceptions || {});

    const acronymPatterns = buildAcronymPatterns(acronyms);
    const exceptionPatterns = buildExceptionPatterns(exceptions);

    function checkNode(node: ESTree.Node & {name: string}) {
      const name = node.name;
      const violations = checkIdentifier(name, acronymPatterns, exceptionPatterns);

      if (violations.length === 0) {
        return;
      }

      const corrected = getCorrectedName(name, violations);

      for (const violation of violations) {
        context.report({
          node,
          messageId:
            violation.type === "exception"
              ? "incorrectException"
              : "incorrectAcronym",
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
      // Variable declarations: const parseUrl = ...
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          checkNode(node.id);
        }
      },
      // Function declarations and expressions: function parseUrl() {}
      "FunctionDeclaration, FunctionExpression"(node: any) {
        if (node.id) {
          checkNode(node.id);
        }
      },
      // Function parameters
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node: any) {
        for (const param of node.params) {
          if (param.type === "Identifier") {
            checkNode(param);
          }
        }
      },
      // Class declarations: class HttpClient {}
      ClassDeclaration(node) {
        if (node.id) {
          checkNode(node.id);
        }
      },
      // Property definitions in object literals: { parseUrl: ... }
      "Property > Identifier.key"(node: any) {
        // Shorthand keys are really references to a binding, which the
        // declaration visitors already rename. Destructuring keys name a
        // property someone else declared, so they are not ours to rename.
        if (
          node.parent.computed ||
          node.parent.shorthand ||
          node.parent.parent.type === "ObjectPattern"
        ) {
          return;
        }
        checkNode(node);
      },
      // Method definitions in classes: parseUrl() {}
      "MethodDefinition > Identifier.key"(node: any) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
      // Class fields: apiUrl = ...
      "PropertyDefinition > Identifier.key"(node: any) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
      // TypeScript interface and type declarations
      TSInterfaceDeclaration(node: any) {
        if (node.id) {
          checkNode(node.id);
        }
      },
      TSTypeAliasDeclaration(node: any) {
        if (node.id) {
          checkNode(node.id);
        }
      },
      // TypeScript property signatures: { parseUrl: string }
      "TSPropertySignature > Identifier.key"(node: any) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
    };
  },
};

export default rule;
