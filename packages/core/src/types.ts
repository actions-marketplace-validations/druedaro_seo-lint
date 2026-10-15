import type { Document } from "./parser.js";

export type Severity = "error" | "warning";

export type Category =
  | "meta"
  | "structure"
  | "i18n"
  | "structured-data"
  | "links"
  | "sitemap"
  | "geo";

export interface Finding {
  ruleId: string;
  severity: Severity;
  category: Category;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
}

export interface RuleContext {
  filePath: string;
  html: string;
  allFiles: string[];
  isMultiLang: boolean;
}

export interface RuleMeta {
  id: string;
  severity: Severity;
  category: Category;
  description: string;
  docsUrl?: string;
}

export interface Rule {
  meta: RuleMeta;
  appliesTo?: (ctx: RuleContext) => boolean;
  check: (doc: Document, ctx: RuleContext) => Finding[];
}

export type RuleConfigEntry =
  | Severity
  | "off"
  | [Severity];

export interface SeoLintConfig {
  dist?: string;
  ignore?: string[];
  rules?: Record<string, RuleConfigEntry>;
}

export interface LintResult {
  findings: Finding[];
  filesAnalysed: number;
  hasErrors: boolean;
}
