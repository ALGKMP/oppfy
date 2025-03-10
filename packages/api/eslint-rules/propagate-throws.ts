/* import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://example.com/rule/${name}`,
);

export const rule = createRule({
  name: "propagate-throws",
  meta: {
    type: "problem",
    docs: {
      description:
        "Propagates unchecked throws (sync and async) until caught in try-catch. Functions that throw or call a throwing function are marked as tainted.",
      recommended: "recommended",
    },
    schema: [],
    messages: {
      uncaught:
        "Function '{{functionName}}' {{direct ? 'throws an exception' : 'calls a throwing function'}} ({{async}}) but is not caught in a try-catch anywhere in the call chain.",
    },
  },
  defaultOptions: [],
  create(context) {
    // Maps to track functions and call sites by name
    const throwingFunctions = new Map<
      string,
      { direct: boolean; node: TSESTree.Node; async: string }
    >();
    const callSites = new Map<
      string,
      Array<{ caller: string; callNode: TSESTree.Node; isAwaited: boolean }>
    >();

    function markAsThrowing(
      functionName: string,
      node: TSESTree.Node,
      isAsync = false,
    ) {
      if (!throwingFunctions.has(functionName)) {
        throwingFunctions.set(functionName, {
          direct: true,
          node,
          async: isAsync ? "async" : "sync",
        });
        propagateThrowing(functionName);
      }
    }

    function propagateThrowing(functionName: string) {
      if (!callSites.has(functionName)) return;
      for (const { caller, callNode, isAwaited } of callSites.get(
        functionName,
      )!) {
        if (throwingFunctions.get(caller)?.direct) continue;
        // Propagate the taint: mark the caller as throwing
        markAsThrowing(caller, callNode, isAwaited);
      }
    }

    // Helper to find Promise.reject calls in a function body
    function findRejectCalls(node: { body: any }): TSESTree.Node[] {
      const rejectCalls: TSESTree.Node[] = [];
      function traverse(n: any) {
        if (
          n &&
          n.type === "CallExpression" &&
          n.callee &&
          n.callee.type === "MemberExpression" &&
          n.callee.object?.name === "Promise" &&
          n.callee.property?.name === "reject"
        ) {
          rejectCalls.push(n);
        }
        for (const key in n) {
          if (n && typeof n[key] === "object") traverse(n[key]);
        }
      }
      traverse(node.body);
      return rejectCalls;
    }

    // Helper to get all ancestors for a node
    function getAncestorsForNode(node: TSESTree.Node): TSESTree.Node[] {
      const ancestors: TSESTree.Node[] = [];
      let current: TSESTree.Node | null = node;
      while (current) {
        ancestors.push(current);
        current = current.parent || null;
      }
      return ancestors;
    }

    // Helper to check if a node is within a try block
    function isNodeInTryBlock(
      node: TSESTree.Node,
      tryStatement: TSESTree.TryStatement,
    ): boolean {
      // Fix: Properly check if the node is within the try block
      const tryBlock = tryStatement.block;

      // Helper function to check if a node is contained within another node
      function isNodeContained(
        container: TSESTree.Node,
        target: TSESTree.Node,
      ): boolean {
        if (container === target) return true;

        // Check all properties of the container node
        for (const key in container) {
          const value = (container as any)[key];

          // Skip non-object properties and parent references
          if (!value || typeof value !== "object" || key === "parent") continue;

          // Check arrays
          if (Array.isArray(value)) {
            for (const item of value) {
              if (
                item &&
                typeof item === "object" &&
                isNodeContained(item, target)
              ) {
                return true;
              }
            }
          }
          // Check objects that are AST nodes
          else if (value.type && isNodeContained(value, target)) {
            return true;
          }
        }

        return false;
      }

      return isNodeContained(tryBlock, node);
    }

    return {
      // Process Function Declarations
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        const functionName = node.id?.name;
        if (!functionName) return;

        const isAsync = node.async;
        let hasThrow = false;

        // Check for direct throw statements via declared variables
        context.getDeclaredVariables(node).forEach((variable) => {
          variable.references.forEach((ref) => {
            const parent = ref.identifier.parent;
            if (parent && parent.type === "ThrowStatement") {
              hasThrow = true;
            }
          });
        });

        // Check for Promise.reject calls
        if (findRejectCalls(node).length > 0) hasThrow = true;

        if (hasThrow) {
          throwingFunctions.set(functionName, {
            direct: true,
            node,
            async: isAsync ? "async" : "sync",
          });
          propagateThrowing(functionName);
        }
      },

      // Process Arrow Functions (commonly assigned to variables)
      ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression) {
        const parent = node.parent;
        const functionName =
          parent &&
          parent.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
            ? parent.id.name
            : null;
        if (!functionName) return;

        const isAsync = node.async;
        let hasThrow = false;

        context.getDeclaredVariables(node).forEach((variable) => {
          variable.references.forEach((ref) => {
            const parent = ref.identifier.parent;
            if (parent && parent.type === "ThrowStatement") {
              hasThrow = true;
            }
          });
        });

        if (findRejectCalls(node).length > 0) hasThrow = true;

        if (hasThrow) {
          throwingFunctions.set(functionName, {
            direct: true,
            node,
            async: isAsync ? "async" : "sync",
          });
          propagateThrowing(functionName);
        }
      },

      // Process function call expressions (for both sync and async calls)
      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type !== "Identifier") return;
        const calleeName = node.callee.name;

        // Find the caller function by looking at ancestors
        const ancestors = context.getAncestors();
        const parentFunction = ancestors
          .slice()
          .reverse()
          .find(
            (a) =>
              a.type === "FunctionDeclaration" ||
              a.type === "ArrowFunctionExpression",
          );
        let callerName: string | null = null;
        if (parentFunction) {
          if (
            parentFunction.type === "FunctionDeclaration" &&
            parentFunction.id
          ) {
            callerName = parentFunction.id.name;
          } else if (
            parentFunction.type === "ArrowFunctionExpression" &&
            parentFunction.parent &&
            parentFunction.parent.type === "VariableDeclarator" &&
            parentFunction.parent.id.type === "Identifier"
          ) {
            callerName = parentFunction.parent.id.name;
          }
        }
        if (!callerName) return;

        // Determine if the call is awaited
        const isAwaited = ancestors.some(
          (a) =>
            a.type === "AwaitExpression" &&
            (a as TSESTree.AwaitExpression).argument === node,
        );

        // Record the call site for propagation
        if (!callSites.has(calleeName)) callSites.set(calleeName, []);
        callSites
          .get(calleeName)!
          .push({ caller: callerName, callNode: node, isAwaited });

        // If the callee is already known to throw, mark the caller as tainted if not in try-catch
        if (throwingFunctions.has(calleeName)) {
          // Fix: Use the new helper function to check if node is in try block
          const isInTryCatch = ancestors.some(
            (a) =>
              a.type === "TryStatement" &&
              isNodeInTryBlock(node, a as TSESTree.TryStatement),
          );

          if (!isInTryCatch) {
            const isCallerAsync =
              parentFunction &&
              "async" in parentFunction &&
              (parentFunction as any).async;
            markAsThrowing(callerName, parentFunction || node, isCallerAsync);
          }
        }
      },

      // At the end of the program, report functions that are tainted but never caught
      "Program:exit"() {
        // Use Array.from to convert Map entries to an array for iteration
        const throwingFunctionEntries = Array.from(throwingFunctions.entries());

        for (const [
          functionName,
          { direct, node, async },
        ] of throwingFunctionEntries) {
          let isCaught = false;
          const callSitesForFunc = callSites.get(functionName) || [];
          for (const { callNode } of callSitesForFunc) {
            const ancestors = getAncestorsForNode(callNode);
            // Fix: Use the new helper function to check if node is in try block
            const isInTryCatch = ancestors.some(
              (a) =>
                a.type === "TryStatement" &&
                isNodeInTryBlock(callNode, a as TSESTree.TryStatement),
            );

            if (isInTryCatch) {
              isCaught = true;
              break;
            }
          }
          if (direct) {
            const ancestors = getAncestorsForNode(node);
            // Fix: Use the new helper function to check if node is in try block
            const isSelfCaught = ancestors.some(
              (a) =>
                a.type === "TryStatement" &&
                isNodeInTryBlock(node, a as TSESTree.TryStatement),
            );

            if (isSelfCaught) isCaught = true;
          }
          if (!isCaught) {
            // Fix: Use messageId instead of message
            context.report({
              node,
              messageId: "uncaught",
              data: {
                functionName,
                direct: direct ? true : false,
                async,
              },
            });
          }
        }
      },
    };
  },
});
 */

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://example.com/rule/${name}`,
);

// Type: RuleModule<"uppercase", ...>
export const rule = createRule({
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (node.id != null) {
          if (/^[a-z]/.test(node.id.name)) {
            context.report({
              messageId: 'uppercase',
              node: node.id,
            });
          }
        }
      },
    };
  },
  name: 'uppercase-first-declarations',
  meta: {
    docs: {
      description:
        'Function declaration names should start with an upper-case letter.',
    },
    messages: {
      uppercase: 'Start this name with an upper-case letter.',
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
});