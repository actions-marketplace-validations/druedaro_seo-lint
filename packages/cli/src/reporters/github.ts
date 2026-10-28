import type { LintResult } from "@seo-lint/core";

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
    lines.push(
      `seo-lint: No SEO/GEO problems found across ${result.filesAnalysed} files.`
    );
  } else {
    lines.push(
      `seo-lint: Found ${errorCount} error(s) and ${warningCount} warning(s) across ${result.filesAnalysed} files.`
    );
  }

  return lines.join("\n") + "\n";
}
