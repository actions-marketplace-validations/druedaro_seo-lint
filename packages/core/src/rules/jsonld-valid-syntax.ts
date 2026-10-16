import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, getAttribute, getTextContent, getLocation, type Document } from "../parser.js";

export const jsonldValidSyntax: Rule = {
  meta: {
    id: "jsonld-valid-syntax",
    severity: "error",
    category: "structured-data",
    description: "All <script type=\"application/ld+json\"> blocks must contain valid JSON.",
    docsUrl: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const scripts = querySelectorAll(doc, "script");

    const jsonLdScripts = scripts.filter((el) => {
      const type = getAttribute(el, "type");
      return type?.trim().toLowerCase() === "application/ld+json";
    });

    for (const script of jsonLdScripts) {
      const loc = getLocation(script);
      const text = getTextContent(script).trim();

      if (text.length === 0) {
        findings.push({
          ruleId: "jsonld-valid-syntax",
          severity: jsonldValidSyntax.meta.severity,
          category: jsonldValidSyntax.meta.category,
          message: "The <script type=\"application/ld+json\"> element is empty.",
          filePath: ctx.filePath,
          ...loc,
        });
        continue;
      }

      try {
        const parsed = JSON.parse(text);
        if (parsed === null || typeof parsed !== "object") {
          findings.push({
            ruleId: "jsonld-valid-syntax",
            severity: jsonldValidSyntax.meta.severity,
            category: jsonldValidSyntax.meta.category,
            message: "JSON-LD content must be a JSON object or array.",
            filePath: ctx.filePath,
            ...loc,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        findings.push({
          ruleId: "jsonld-valid-syntax",
          severity: jsonldValidSyntax.meta.severity,
          category: jsonldValidSyntax.meta.category,
          message: `Malformed JSON-LD syntax: ${errorMsg}`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
