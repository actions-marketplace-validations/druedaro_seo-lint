import type { LintResult } from "@seo-lint/core";

export function formatJsonReport(result: LintResult): string {
  return JSON.stringify(result, null, 2) + "\n";
}
