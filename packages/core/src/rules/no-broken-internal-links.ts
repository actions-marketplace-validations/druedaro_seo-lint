import type { Rule, RuleContext, Finding } from "../types.js";
import {
  querySelectorAll,
  getAttribute,
  getLocation,
  type Document,
} from "../parser.js";
import * as path from "path";

/**
 * no-broken-internal-links rule
 * Checks that every internal <a href> points to an existing file in the
 * analysed `dist` directory.
 */
export const noBrokenInternalLinks: Rule = {
  meta: {
    id: "no-broken-internal-links",
    severity: "error",
    category: "links",
    description:
      "Internal <a> links must point to existing files in the analysed dist folder.",
    docsUrl: "https://github.com/druedaro/seo-lint#no-broken-internal-links",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const anchors = querySelectorAll(doc, "a");
    for (const el of anchors) {
      const href = getAttribute(el, "href");
      if (!href) continue;
      const raw = href.trim();

      // Skip external URLs (http:, https:, mailto:, tel:, etc.)
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("/")) continue;
      // Skip protocol‑relative URLs (//example.com)
      if (raw.startsWith("//")) continue;

      // Remove query string and hash fragment, safe string handling
      const cleanHref = raw.split(/[?#]/)[0];
      if (!cleanHref) continue; // ignore empty or hash-only links

      // Resolve the path relative to the current file
      const baseDir = path.dirname(ctx.filePath);
      const resolvedPath = path.normalize(
        path.isAbsolute(cleanHref) ? cleanHref.slice(1) : path.join(baseDir, cleanHref)
      );

      // The list of files available in the dist folder comes from ctx.allFiles
      if (!ctx.allFiles.includes(resolvedPath)) {
        const loc = getLocation(el);
        findings.push({
          ruleId: "no-broken-internal-links",
          severity: noBrokenInternalLinks.meta.severity,
          category: noBrokenInternalLinks.meta.category,
          message: `Internal link "${href}" points to a non‑existent file "${resolvedPath}".`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }
    return findings;
  },
};
