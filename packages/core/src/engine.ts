/**
 * engine.ts — orchestrates rules over parsed HTML documents.
 *
 * The engine is the glue between the parser, the rule registry, and the
 * user's configuration. It:
 * 1. Parses each HTML file.
 * 2. Filters rules based on `appliesTo` guards and user config overrides.
 * 3. Runs each active rule and collects findings.
 * 4. Applies severity overrides from user config.
 */

import type { Document } from "parse5/dist/tree-adapters/default.js";
import { parseHtml } from "./parser.js";
import { builtinRules } from "./rules/index.js";
import type {
  Rule,
  RuleContext,
  Finding,
  LintResult,
  SeoLintConfig,
  RuleConfigEntry,
  Severity,
} from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveRuleSeverity(
  rule: Rule,
  configEntry: RuleConfigEntry | undefined,
): Severity | "off" {
  if (configEntry === undefined) return rule.meta.severity;
  if (configEntry === "off") return "off";
  if (typeof configEntry === "string") return configEntry;
  // Tuple form: [severity]
  return configEntry[0];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LintFileOptions {
  /** Relative path within the dist dir (e.g. "blog/post.html"). */
  filePath: string;
  /** Raw HTML content. */
  html: string;
  /** All HTML file paths in the dist dir (for cross-file rules). */
  allFiles: string[];
  /** Whether the dist dir contains multi-lang content. */
  isMultiLang: boolean;
  /** User config (if any). */
  config?: SeoLintConfig;
}

/**
 * Lint a single HTML file against all applicable rules.
 * This is the lowest-level API — the CLI calls this per file.
 */
export function lintFile(options: LintFileOptions): Finding[] {
  const { filePath, html, allFiles, isMultiLang, config } = options;

  const doc: Document = parseHtml(html);

  const ctx: RuleContext = {
    filePath,
    html,
    allFiles,
    isMultiLang,
  };

  const findings: Finding[] = [];

  for (const rule of builtinRules) {
    // Check user config: is this rule disabled?
    const configEntry = config?.rules?.[rule.meta.id];
    const effectiveSeverity = resolveRuleSeverity(rule, configEntry);

    if (effectiveSeverity === "off") continue;

    // Check conditional activation (e.g. i18n rules on monolingual sites).
    if (rule.appliesTo && !rule.appliesTo(ctx)) continue;

    // Run the rule.
    const ruleFindings = rule.check(doc, ctx);

    // Apply severity override from config.
    for (const finding of ruleFindings) {
      finding.severity = effectiveSeverity;
      findings.push(finding);
    }
  }

  return findings;
}

/**
 * Lint multiple HTML files and aggregate results.
 */
export function lintFiles(
  files: Array<{ filePath: string; html: string }>,
  options: {
    allFiles: string[];
    isMultiLang: boolean;
    config?: SeoLintConfig;
  },
): LintResult {
  const allFindings: Finding[] = [];

  for (const file of files) {
    const findings = lintFile({
      filePath: file.filePath,
      html: file.html,
      allFiles: options.allFiles,
      isMultiLang: options.isMultiLang,
      config: options.config,
    });
    allFindings.push(...findings);
  }

  return {
    findings: allFindings,
    filesAnalysed: files.length,
    hasErrors: allFindings.some((f) => f.severity === "error"),
  };
}
