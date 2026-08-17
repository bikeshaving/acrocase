/**
 * @fileoverview Enforce ACROCase naming conventions for acronyms
 */

const dictionary = require("../../dictionary.json");

// Build regex patterns for detecting incorrectly cased acronyms.
// For each acronym like "URL", detect the titlecase form "Url".
function buildAcronymPatterns(acronyms) {
  const patterns = [];

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
function buildExceptionPatterns(exceptions) {
  const patterns = [];

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

function checkIdentifier(name, acronymPatterns, exceptionPatterns) {
  const violations = [];

  for (const { pattern, acronym, titleCase } of acronymPatterns) {
    pattern.lastIndex = 0;
    let match;
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
    let match;
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

function getCorrectedName(name, violations) {
  let corrected = name;
  const sorted = [...violations].sort((a, b) => b.index - a.index);

  for (const violation of sorted) {
    const before = corrected.slice(0, violation.index);
    const after = corrected.slice(violation.index + violation.found.length);
    corrected = before + violation.expected + after;
  }

  return corrected;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce ACROCase naming conventions for acronyms",
      category: "Stylistic Issues",
      recommended: true,
      url: "https://acrocase.org",
    },
    fixable: "code",
    hasSuggestions: true,
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
      renameMember: "Rename to '{{corrected}}'.",
    },
  },

  create(context) {
    const options = context.options[0] || {};

    const acronyms = Object.keys(dictionary.acronyms);
    if (options.acronyms) {
      acronyms.push(...options.acronyms);
    }

    const exceptions = Object.keys(dictionary.exceptions || {});

    const acronymPatterns = buildAcronymPatterns(acronyms);
    const exceptionPatterns = buildExceptionPatterns(exceptions);

    const sourceCode = context.sourceCode || context.getSourceCode();

    // Every binding the identifier introduces. A class declaration yields two
    // (the outer binding and the class-body binding), and both must be renamed.
    function getBindings(node, declaration) {
      return sourceCode
        .getDeclaredVariables(declaration)
        .filter((variable) => variable.identifiers.includes(node));
    }

    // A named export is part of the module's public API: importers live in
    // files ESLint is not looking at, so renaming one cannot be done safely as
    // an autofix. A default export is exempt because importers choose their own
    // local name, making the declaration's name private after all.
    function isNamedExport(bindings, declaration) {
      if (declaration.parent && declaration.parent.type === "ExportNamedDeclaration") {
        return true;
      }

      if (
        declaration.parent &&
        declaration.parent.type === "VariableDeclaration" &&
        declaration.parent.parent &&
        declaration.parent.parent.type === "ExportNamedDeclaration"
      ) {
        return true;
      }

      return bindings.some((variable) =>
        variable.references.some(
          (reference) =>
            reference.identifier.parent &&
            reference.identifier.parent.type === "ExportSpecifier",
        ),
      );
    }

    // Renaming into a name that already exists can break the code two ways:
    // redeclaring it in the same scope, or letting a nearer binding capture a
    // reference that used to resolve here. Shadowing a name from an enclosing
    // scope is not a problem, so the search deliberately stops at the binding's
    // own scope rather than walking to the top.
    function isNameTaken(bindings, corrected) {
      const declares = (scope) =>
        scope.variables.some((variable) => variable.name === corrected);

      return bindings.some((variable) => {
        if (declares(variable.scope)) {
          return true;
        }

        return variable.references.some((reference) => {
          for (
            let scope = reference.from;
            scope && scope !== variable.scope;
            scope = scope.upper
          ) {
            if (declares(scope)) {
              return true;
            }
          }
          return false;
        });
      });
    }

    // Rename the binding along with every reference to it, so the fix cannot
    // leave call sites pointing at a name that no longer exists.
    function renameBinding(fixer, bindings, corrected) {
      const fixes = [];
      const seen = new Set();

      function replace(identifier, text) {
        const key = `${identifier.range[0]}:${identifier.range[1]}`;
        if (seen.has(key)) {
          return;
        }
        seen.add(key);

        // A typed identifier's range covers its annotation too, so replacing
        // the whole node would delete `: string` along with the name. Rewrite
        // only up to where the annotation starts, keeping any `?` marker.
        if (identifier.typeAnnotation) {
          fixes.push(
            fixer.replaceTextRange(
              [identifier.range[0], identifier.typeAnnotation.range[0]],
              `${text}${identifier.optional ? "?" : ""}`,
            ),
          );
          return;
        }

        fixes.push(fixer.replaceText(identifier, text));
      }

      for (const variable of bindings) {
        for (const identifier of variable.identifiers) {
          replace(identifier, corrected);
        }

        for (const reference of variable.references) {
          const identifier = reference.identifier;
          const parent = identifier.parent;
          // `{ apiUrl }` is shorthand for `{ apiUrl: apiUrl }`. Renaming it in
          // place would silently change the property key too, so expand it.
          if (
            parent &&
            parent.type === "Property" &&
            parent.shorthand &&
            parent.value === identifier
          ) {
            replace(identifier, `${identifier.name}: ${corrected}`);
          } else {
            replace(identifier, corrected);
          }
        }
      }

      return fixes;
    }

    // `declaration` is the node that introduces the binding, if any. Without
    // one the name is a member (a property key or method), whose references we
    // cannot resolve, so the rename is offered as a suggestion instead of a fix.
    function checkNode(node, declaration) {
      const name = node.name;
      const violations = checkIdentifier(name, acronymPatterns, exceptionPatterns);

      if (violations.length === 0) {
        return;
      }

      const corrected = getCorrectedName(name, violations);
      const bindings = declaration ? getBindings(node, declaration) : [];
      const exported = bindings.length > 0 && isNamedExport(bindings, declaration);

      for (const violation of violations) {
        const report = {
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
        };

        if (exported || (bindings.length > 0 && isNameTaken(bindings, corrected))) {
          // No safe rename. Either importers live in files ESLint is not
          // looking at, or the corrected name is already in scope. Report only.
        } else if (bindings.length > 0) {
          report.fix = (fixer) => renameBinding(fixer, bindings, corrected);
        } else {
          // A member's references cannot be resolved, so offer the rename as a
          // suggestion the user opts into rather than an autofix.
          report.suggest = [
            {
              messageId: "renameMember",
              data: { corrected },
              fix: (fixer) => fixer.replaceText(node, corrected),
            },
          ];
        }

        context.report(report);
      }
    }

    return {
      // Variable declarations: const parseUrl = ...
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          checkNode(node.id, node);
        }
      },
      // Function declarations and expressions: function parseUrl() {}
      "FunctionDeclaration, FunctionExpression"(node) {
        if (node.id) {
          checkNode(node.id, node);
        }
      },
      // Function parameters
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
        for (const param of node.params) {
          if (param.type === "Identifier") {
            checkNode(param, node);
          }
        }
      },
      // Class declarations: class HttpClient {}
      ClassDeclaration(node) {
        if (node.id) {
          checkNode(node.id, node);
        }
      },
      // Property definitions in object literals: { parseUrl: ... }
      "Property > Identifier.key"(node) {
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
      "MethodDefinition > Identifier.key"(node) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
      // Class fields: apiUrl = ...
      "PropertyDefinition > Identifier.key"(node) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
      // TypeScript interface and type declarations
      TSInterfaceDeclaration(node) {
        if (node.id) {
          checkNode(node.id, node);
        }
      },
      TSTypeAliasDeclaration(node) {
        if (node.id) {
          checkNode(node.id, node);
        }
      },
      // TypeScript property signatures: { parseUrl: string }
      "TSPropertySignature > Identifier.key"(node) {
        if (!node.parent.computed) {
          checkNode(node);
        }
      },
    };
  },
};
