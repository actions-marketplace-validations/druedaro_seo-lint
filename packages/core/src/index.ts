/**
 * @seo-lint/core — public API surface.
 *
 * Re-exports everything consumers need: types, engine functions, parser
 * utilities, and the built-in rule registry.
 */

// Types
export type {
  Severity,
  Category,
  Finding,
  RuleContext,
  RuleMeta,
  Rule,
  RuleConfigEntry,
  SeoLintConfig,
  LintResult,
} from "./types.js";

// Engine
export { lintFile, lintFiles } from "./engine.js";
export type { LintFileOptions } from "./engine.js";

// Parser utilities (for custom rules)
export {
  parseHtml,
  querySelector,
  querySelectorAll,
  getAttribute,
  hasAttribute,
  getTextContent,
  getLocation,
  walkElements,
  isElement,
  isTextNode,
} from "./parser.js";

// Built-in rules
export { builtinRules } from "./rules/index.js";
