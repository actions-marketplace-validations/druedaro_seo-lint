import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelector, hasAttribute, getAttribute, getLocation, type Document } from "../parser.js";

function isValidBcp47(tag: string): boolean {
  if (tag.includes("_")) return false;
  try {
    const loc = new Intl.Locale(tag);
    return Boolean(loc.language);
  } catch {
    return false;
  }
}

export const langAttribute: Rule = {
  meta: {
    id: "lang-attribute",
    severity: "error",
    category: "structure",
    description: "The <html> element must have a valid BCP 47 lang attribute.",
    docsUrl: "https://www.w3.org/International/questions/qa-html-language-declarations",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const htmlEl = querySelector(doc, "html");

    if (!htmlEl) {
      findings.push({
        ruleId: "lang-attribute",
        severity: langAttribute.meta.severity,
        category: langAttribute.meta.category,
        message: "Missing <html> root element.",
        filePath: ctx.filePath,
      });
      return findings;
    }

    const loc = getLocation(htmlEl);

    if (!hasAttribute(htmlEl, "lang")) {
      findings.push({
        ruleId: "lang-attribute",
        severity: langAttribute.meta.severity,
        category: langAttribute.meta.category,
        message: 'The <html> element is missing a "lang" attribute.',
        filePath: ctx.filePath,
        ...loc,
      });
      return findings;
    }

    const rawLang = getAttribute(htmlEl, "lang") ?? "";
    const trimmed = rawLang.trim();

    if (trimmed.length === 0) {
      findings.push({
        ruleId: "lang-attribute",
        severity: langAttribute.meta.severity,
        category: langAttribute.meta.category,
        message: 'The <html> "lang" attribute is empty.',
        filePath: ctx.filePath,
        ...loc,
      });
      return findings;
    }

    if (!isValidBcp47(trimmed)) {
      findings.push({
        ruleId: "lang-attribute",
        severity: langAttribute.meta.severity,
        category: langAttribute.meta.category,
        message: `The <html> "lang" attribute ("${trimmed}") is not a valid BCP 47 language tag.`,
        filePath: ctx.filePath,
        ...loc,
      });
    }

    return findings;
  },
};
