import type { Rule, RuleContext, Finding, RuleMeta } from "../types.js";
import { querySelectorAll, getAttribute, getLocation, type Document } from "../parser.js";

const meta: RuleMeta = {
  id: "llms-txt-present",
  severity: "warning",
  category: "geo",
  description: "llms.txt file should exist and have a valid markdown structure",
  docsUrl: "https://llmstxt.org/",
};

function check(doc: Document, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];

  const links = querySelectorAll(doc, "link");
  const describedByLlms = links.find((l) => {
    const rel = getAttribute(l, "rel") ?? "";
    const href = getAttribute(l, "href") ?? "";
    return rel.toLowerCase() === "describedby" && href.includes("llms.txt");
  });

  const content = ctx.getFileContent?.("llms.txt");
  const hasFileInAll = ctx.allFiles.some(
    (f) => f === "llms.txt" || f === "/llms.txt" || f.endsWith("/llms.txt")
  );

  if (describedByLlms && !content && !hasFileInAll) {
    const loc = getLocation(describedByLlms);
    findings.push({
      ruleId: meta.id,
      severity: meta.severity,
      category: meta.category,
      message: "Linked llms.txt file does not exist at site root.",
      filePath: ctx.filePath,
      ...loc,
    });
    return findings;
  }

  if (!content && !hasFileInAll) {
    return findings;
  }

  if (content !== undefined) {
    if (!content.trim()) {
      findings.push({
        ruleId: meta.id,
        severity: meta.severity,
        category: meta.category,
        message: "llms.txt file is empty.",
        filePath: "llms.txt",
      });
      return findings;
    }

    if (!/^#\s+\S+/m.test(content)) {
      findings.push({
        ruleId: meta.id,
        severity: meta.severity,
        category: meta.category,
        message: "llms.txt is missing a top-level H1 title (e.g. '# Project Name').",
        filePath: "llms.txt",
      });
    }
  }

  return findings;
}

export const llmsTxtPresent: Rule = {
  meta,
  appliesTo(ctx: RuleContext): boolean {
    return !ctx.allFiles.length || ctx.filePath === ctx.allFiles[0];
  },
  check,
};
