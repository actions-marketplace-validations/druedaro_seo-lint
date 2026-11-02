import type { Rule, RuleContext, Finding } from "../types.js";
import {
  querySelectorAll,
  getAttribute,
  getLocation,
  type Document,
} from "../parser.js";

function parseViewportContent(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of content.split(/[,;]/)) {
    const [key, val] = part.split("=").map((s) => s.trim().toLowerCase());
    if (key) {
      map.set(key, val ?? "");
    }
  }
  return map;
}

export const metaViewportAccessible: Rule = {
  meta: {
    id: "meta-viewport-accessible",
    severity: "warning",
    category: "meta",
    description:
      '<meta name="viewport"> must be present and must not disable user scalability (avoid user-scalable=no or maximum-scale < 2).',
    docsUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag#accessibility",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const metaTags = querySelectorAll(doc, "meta");

    const viewportMeta = metaTags.find((el) => {
      const name = getAttribute(el, "name")?.trim().toLowerCase();
      return name === "viewport";
    });

    if (!viewportMeta) {
      findings.push({
        ruleId: "meta-viewport-accessible",
        severity: metaViewportAccessible.meta.severity,
        category: metaViewportAccessible.meta.category,
        message: 'Document is missing a <meta name="viewport"> tag.',
        filePath: ctx.filePath,
      });
      return findings;
    }

    const loc = getLocation(viewportMeta);
    const content = getAttribute(viewportMeta, "content")?.trim();

    if (!content) {
      findings.push({
        ruleId: "meta-viewport-accessible",
        severity: metaViewportAccessible.meta.severity,
        category: metaViewportAccessible.meta.category,
        message: '<meta name="viewport"> tag is missing a "content" attribute.',
        filePath: ctx.filePath,
        ...loc,
      });
      return findings;
    }

    const directives = parseViewportContent(content);

    const userScalable = directives.get("user-scalable");
    if (userScalable === "no" || userScalable === "0") {
      findings.push({
        ruleId: "meta-viewport-accessible",
        severity: metaViewportAccessible.meta.severity,
        category: metaViewportAccessible.meta.category,
        message:
          '<meta name="viewport"> disables pinch-to-zoom with "user-scalable=no". This violates accessibility guidelines (WCAG 1.4.4).',
        filePath: ctx.filePath,
        ...loc,
      });
    }

    const maxScaleStr = directives.get("maximum-scale");
    if (maxScaleStr !== undefined) {
      const maxScale = parseFloat(maxScaleStr);
      if (!isNaN(maxScale) && maxScale < 2) {
        findings.push({
          ruleId: "meta-viewport-accessible",
          severity: metaViewportAccessible.meta.severity,
          category: metaViewportAccessible.meta.category,
          message: `<meta name="viewport"> restricts zoom with "maximum-scale=${maxScaleStr}" (< 2). Browsers recommend at least 2.0 or omitting it.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
