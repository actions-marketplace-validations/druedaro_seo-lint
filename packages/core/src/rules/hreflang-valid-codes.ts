import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, hasAttribute, getAttribute, getLocation, type Document } from "../parser.js";

function isValidHreflangCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  if (normalized === "x-default") return true;
  if (normalized.includes("_")) return false;

  try {
    const loc = new Intl.Locale(normalized);
    return Boolean(loc.language);
  } catch {
    return false;
  }
}

export const hreflangValidCodes: Rule = {
  meta: {
    id: "hreflang-valid-codes",
    severity: "error",
    category: "i18n",
    description: "Hreflang attributes must use valid BCP 47 language/region codes or \"x-default\".",
    docsUrl: "https://developers.google.com/search/docs/specialty/international/localized-versions",
  },

  appliesTo(ctx: RuleContext): boolean {
    return ctx.isMultiLang || ctx.html.includes("hreflang");
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const links = querySelectorAll(doc, "link");

    for (const link of links) {
      if (!hasAttribute(link, "hreflang")) continue;

      const loc = getLocation(link);
      const rawCode = getAttribute(link, "hreflang") ?? "";
      const trimmed = rawCode.trim();

      if (trimmed.length === 0) {
        findings.push({
          ruleId: "hreflang-valid-codes",
          severity: hreflangValidCodes.meta.severity,
          category: hreflangValidCodes.meta.category,
          message: 'The <link rel="alternate"> element has an empty "hreflang" attribute.',
          filePath: ctx.filePath,
          ...loc,
        });
        continue;
      }

      if (!isValidHreflangCode(trimmed)) {
        findings.push({
          ruleId: "hreflang-valid-codes",
          severity: hreflangValidCodes.meta.severity,
          category: hreflangValidCodes.meta.category,
          message: `Invalid hreflang code "${trimmed}". Must be a valid BCP 47 code or "x-default".`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
