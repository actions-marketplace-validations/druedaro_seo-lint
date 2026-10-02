/**
 * types.ts — core type definitions for seo-lint.
 *
 * These are the contracts that the engine, every rule, and the CLI all
 * operate on. Changing these types is a breaking change.
 */

// ---------------------------------------------------------------------------
// Severity & categories
// ---------------------------------------------------------------------------

export type Severity = "error" | "warning";

export type Category =
  | "meta"
  | "structure"
  | "i18n"
  | "structured-data"
  | "links"
  | "sitemap"
  | "geo";

// ---------------------------------------------------------------------------
// Findings — what a rule produces
// ---------------------------------------------------------------------------

export interface Finding {
  /** Rule that produced this finding, e.g. "title-present". */
  ruleId: string;
  severity: Severity;
  category: Category;
  /** Human-readable message explaining the problem. */
  message: string;
  /** Relative path to the file within the dist directory. */
  filePath: string;
  /** 1-based line number in the source HTML, if available. */
  line?: number;
  /** 1-based column number in the source HTML, if available. */
  column?: number;
}

// ---------------------------------------------------------------------------
// Rule context — what the engine provides to each rule
// ---------------------------------------------------------------------------

export interface RuleContext {
  /** Relative path of the file being analysed (e.g. "index.html"). */
  filePath: string;
  /** The raw HTML string, useful for line-number lookups. */
  html: string;
  /** All file paths found in the dist directory. */
  allFiles: string[];
  /** Whether the overall dist seems to be a multi-language site. */
  isMultiLang: boolean;
}

// ---------------------------------------------------------------------------
// Rule definition
// ---------------------------------------------------------------------------

export interface RuleMeta {
  /** Unique, kebab-case identifier (e.g. "title-present"). */
  id: string;
  /** Default severity — can be overridden by user config. */
  severity: Severity;
  category: Category;
  /** One-line explanation of what this rule checks. */
  description: string;
  /** URL to the authoritative reference (Google Search Central, MDN, etc.). */
  docsUrl?: string;
}

export interface Rule {
  meta: RuleMeta;
  /**
   * Optional guard: if defined, the engine calls it first. Return `false` to
   * skip this rule for the current file/context (e.g. i18n rules on a
   * monolingual site).
   */
  appliesTo?: (ctx: RuleContext) => boolean;
  /**
   * The actual check. Must be a pure function: no side-effects, no shared
   * state. Returns an array of findings (empty = the rule passed).
   */
  check: (doc: import("parse5/dist/tree-adapters/default.js").Document, ctx: RuleContext) => Finding[];
}

// ---------------------------------------------------------------------------
// Config (user-facing, validated by @seo-lint/config via Zod)
// ---------------------------------------------------------------------------

export type RuleConfigEntry =
  | Severity       // just override severity
  | "off"          // disable the rule
  | [Severity];    // explicit tuple (same as bare severity, extensible later)

export interface SeoLintConfig {
  /** Directory to analyse. Default: "dist". */
  dist?: string;
  /** Glob patterns of files to ignore. */
  ignore?: string[];
  /** Per-rule overrides. */
  rules?: Record<string, RuleConfigEntry>;
}

// ---------------------------------------------------------------------------
// Engine result
// ---------------------------------------------------------------------------

export interface LintResult {
  /** All findings, across all files and rules. */
  findings: Finding[];
  /** Number of files analysed. */
  filesAnalysed: number;
  /** Whether any finding has severity "error". */
  hasErrors: boolean;
}
