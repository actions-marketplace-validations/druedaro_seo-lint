/**
 * single-h1 — checks that each page has exactly one <h1> element.
 *
 * Why exactly one?
 * While HTML5 technically allows multiple h1s in sectioning content, Google's
 * John Mueller has confirmed that a single h1 per page is the recommended
 * practice. Multiple h1s dilute the topical signal and confuse screen
 * readers about the page hierarchy.
 *
 * @see https://developers.google.com/search/docs/appearance/title-link
 */

import type { Document } from "parse5/dist/tree-adapters/default.js";
import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, getTextContent, getLocation } from "../parser.js";

export const singleH1: Rule = {
  meta: {
    id: "single-h1",
    severity: "warning",
    category: "structure",
    description: "Page should have exactly one <h1> element.",
    docsUrl:
      "https://developers.google.com/search/docs/appearance/title-link",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const h1s = querySelectorAll(doc, "h1");

    if (h1s.length === 0) {
      findings.push({
        ruleId: "single-h1",
        severity: singleH1.meta.severity,
        category: singleH1.meta.category,
        message: "Page is missing an <h1> element.",
        filePath: ctx.filePath,
      });
    } else if (h1s.length > 1) {
      // Report each extra h1 so the user can decide which to keep.
      for (const h1 of h1s.slice(1)) {
        const loc = getLocation(h1);
        const fullText = getTextContent(h1).trim();
        const preview = fullText.slice(0, 40);
        findings.push({
          ruleId: "single-h1",
          severity: singleH1.meta.severity,
          category: singleH1.meta.category,
          message: `Multiple <h1> elements found. Extra h1: "${preview}${fullText.length > 40 ? "…" : ""}"`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    } else {
      // Exactly one h1 — check it's not empty.
      const h1 = h1s[0]!;
      const text = getTextContent(h1).trim();
      if (text.length === 0) {
        const loc = getLocation(h1);
        findings.push({
          ruleId: "single-h1",
          severity: singleH1.meta.severity,
          category: singleH1.meta.category,
          message: "The <h1> element is empty.",
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
