import type { Rule, RuleContext, Finding } from "../types.js";
import {
  querySelectorAll,
  getAttribute,
  hasAttribute,
  getTextContent,
  getLocation,
  type Document,
  type Element,
} from "../parser.js";

function hasAccessibleName(el: Element): boolean {
  const ariaLabel = getAttribute(el, "aria-label")?.trim();
  if (ariaLabel) return true;

  const ariaLabelledBy = getAttribute(el, "aria-labelledby")?.trim();
  if (ariaLabelledBy) return true;

  const title = getAttribute(el, "title")?.trim();
  if (title) return true;

  const text = getTextContent(el).trim();
  if (text.length > 0) return true;

  const images = querySelectorAll(el, "img");
  for (const img of images) {
    const alt = getAttribute(img, "alt")?.trim();
    if (alt) return true;
  }

  const svgs = querySelectorAll(el, "svg");
  for (const svg of svgs) {
    const svgAria = getAttribute(svg, "aria-label")?.trim();
    if (svgAria) return true;
    const svgTitles = querySelectorAll(svg, "title");
    for (const t of svgTitles) {
      if (getTextContent(t).trim().length > 0) return true;
    }
  }

  return false;
}

export const linkHasAccessibleName: Rule = {
  meta: {
    id: "link-has-accessible-name",
    severity: "warning",
    category: "links",
    description:
      "All <a> links must have an accessible name (discernible text, aria-label, aria-labelledby, or an image with alt text).",
    docsUrl: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const anchors = querySelectorAll(doc, "a");

    for (const a of anchors) {
      if (!hasAttribute(a, "href")) continue;

      if (!hasAccessibleName(a)) {
        const loc = getLocation(a);
        const href = getAttribute(a, "href")?.trim();
        const preview = href
          ? ` (href: "${href.slice(0, 50)}${href.length > 50 ? "…" : ""}")`
          : "";

        findings.push({
          ruleId: "link-has-accessible-name",
          severity: linkHasAccessibleName.meta.severity,
          category: linkHasAccessibleName.meta.category,
          message: `Link does not have an accessible name${preview}. Add visible text, an aria-label, or an image with alt text.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
