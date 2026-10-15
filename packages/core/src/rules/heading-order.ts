import type { Rule, RuleContext, Finding } from "../types.js";
import { walkElements, getLocation, type Document } from "../parser.js";

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export const headingOrder: Rule = {
  meta: {
    id: "heading-order",
    severity: "warning",
    category: "structure",
    description: "Heading levels should not skip steps (e.g. <h2> to <h4> without <h3>).",
    docsUrl: "https://www.w3.org/WAI/tutorials/page-structure/headings/",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    let lastLevel = 0;

    for (const el of walkElements(doc)) {
      if (!HEADING_TAGS.has(el.tagName)) continue;

      const currentLevel = parseInt(el.tagName.charAt(1), 10);
      const loc = getLocation(el);

      if (lastLevel === 0) {
        if (currentLevel > 1) {
          findings.push({
            ruleId: "heading-order",
            severity: headingOrder.meta.severity,
            category: headingOrder.meta.category,
            message: `First heading on the page is <${el.tagName}>, expected <h1>.`,
            filePath: ctx.filePath,
            ...loc,
          });
        }
      } else if (currentLevel > lastLevel + 1) {
        findings.push({
          ruleId: "heading-order",
          severity: headingOrder.meta.severity,
          category: headingOrder.meta.category,
          message: `Heading level skipped: <h${lastLevel}> is followed by <${el.tagName}> without an <h${lastLevel + 1}>.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }

      lastLevel = currentLevel;
    }

    return findings;
  },
};
