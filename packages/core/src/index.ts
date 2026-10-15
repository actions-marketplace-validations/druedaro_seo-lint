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

export { lintFile, lintFiles } from "./engine.js";
export type { LintFileOptions } from "./engine.js";

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
export type {
  Document,
  Element,
  ParentNode,
  ChildNode,
  TextNode,
  CommentNode,
  Node,
  Attribute,
} from "./parser.js";

export { builtinRules } from "./rules/index.js";
