import { parseHtml, type Document } from "./parser.js";
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

function resolveRuleSeverity(
  rule: Rule,
  configEntry: RuleConfigEntry | undefined,
): Severity | "off" {
  if (configEntry === undefined) return rule.meta.severity;
  if (configEntry === "off") return "off";
  if (typeof configEntry === "string") return configEntry;
  return configEntry[0];
}

export interface LintFileOptions {
  filePath: string;
  html: string;
  allFiles: string[];
  isMultiLang: boolean;
  config?: SeoLintConfig;
  getFileContent?: (path: string) => string | undefined;
}

export function lintFile(options: LintFileOptions): Finding[] {
  const { filePath, html, allFiles, isMultiLang, config, getFileContent } = options;

  const doc: Document = parseHtml(html);

  const ctx: RuleContext = {
    filePath,
    html,
    allFiles,
    isMultiLang,
    getFileContent,
  };

  const findings: Finding[] = [];

  for (const rule of builtinRules) {
    const configEntry = config?.rules?.[rule.meta.id];
    const effectiveSeverity = resolveRuleSeverity(rule, configEntry);

    if (effectiveSeverity === "off") continue;

    if (rule.appliesTo && !rule.appliesTo(ctx)) continue;

    const ruleFindings = rule.check(doc, ctx);

    for (const finding of ruleFindings) {
      finding.severity = effectiveSeverity;
      findings.push(finding);
    }
  }

  return findings;
}

export function lintFiles(
  files: Array<{ filePath: string; html: string }>,
  options: {
    allFiles: string[];
    isMultiLang: boolean;
    config?: SeoLintConfig;
  },
): LintResult {
  const allFindings: Finding[] = [];

  const filesMap = new Map<string, string>();
  for (const file of files) {
    filesMap.set(file.filePath, file.html);
  }

  const getFileContent = (path: string): string | undefined => {
    if (filesMap.has(path)) return filesMap.get(path);
    const clean = path.replace(/^\//, "");
    if (filesMap.has(clean)) return filesMap.get(clean);
    if (filesMap.has(`${clean}/index.html`)) return filesMap.get(`${clean}/index.html`);
    if (filesMap.has(`${clean}.html`)) return filesMap.get(`${clean}.html`);
    return undefined;
  };

  for (const file of files) {
    const findings = lintFile({
      filePath: file.filePath,
      html: file.html,
      allFiles: options.allFiles,
      isMultiLang: options.isMultiLang,
      config: options.config,
      getFileContent,
    });
    allFindings.push(...findings);
  }

  return {
    findings: allFindings,
    filesAnalysed: files.length,
    hasErrors: allFindings.some((f) => f.severity === "error"),
  };
}
