import type { LintResult } from "@seo-lint/core";
import { getRepeatedBrokenLinks } from "./utils.js";

export function formatGithubReport(result: LintResult): string {
  const lines: string[] = [];

  for (const f of result.findings) {
    const level = f.severity === "error" ? "error" : "warning";
    const parts = [`file=${f.filePath}`];
    if (f.line !== undefined) parts.push(`line=${f.line}`);
    if (f.column !== undefined) parts.push(`col=${f.column}`);

    lines.push(`::${level} ${parts.join(",")}::${f.filePath}: [${f.ruleId}] ${f.message}`);
  }

  const errorCount = result.findings.filter((f) => f.severity === "error").length;
  const warningCount = result.findings.filter((f) => f.severity === "warning").length;

  if (result.findings.length === 0) {
    if (result.filesAnalysed === 0) {
      lines.push(
        "::warning::seo-lint: No HTML files found to audit. Did you build the project first? Check your target directory."
      );
    } else {
      lines.push(
        `seo-lint: No SEO/GEO problems found across ${result.filesAnalysed} files.`
      );
    }
  } else {
    lines.push(
      `seo-lint: Found ${errorCount} error(s) and ${warningCount} warning(s) across ${result.filesAnalysed} files.`
    );
  }

  for (const item of getRepeatedBrokenLinks(result.findings)) {
    lines.push(
      `::notice::seo-lint tip: Broken link "${item.href}" is repeated across ${item.count} pages (likely in a shared Footer or Header component).`
    );
  }

  return lines.join("\n") + "\n";
}
