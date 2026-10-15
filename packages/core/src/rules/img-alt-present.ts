import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, hasAttribute, getAttribute, getLocation, type Document } from "../parser.js";

export const imgAltPresent: Rule = {
  meta: {
    id: "img-alt-present",
    severity: "warning",
    category: "structure",
    description: "Every content image must have an alt attribute (decorative images should use alt=\"\").",
    docsUrl: "https://developers.google.com/search/docs/appearance/google-images",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const images = querySelectorAll(doc, "img");

    for (const img of images) {
      if (!hasAttribute(img, "alt")) {
        const loc = getLocation(img);
        const src = getAttribute(img, "src");
        const preview = src ? ` (src: "${src.slice(0, 50)}${src.length > 50 ? "…" : ""}")` : "";

        findings.push({
          ruleId: "img-alt-present",
          severity: imgAltPresent.meta.severity,
          category: imgAltPresent.meta.category,
          message: `Image is missing an "alt" attribute${preview}.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
