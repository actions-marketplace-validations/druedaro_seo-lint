import type { Rule, RuleContext, Finding } from "../types.js";
import {
  querySelectorAll,
  getAttribute,
  getLocation,
  type Document,
} from "../parser.js";
import * as path from "path";

/**
 * no-redirect-chains rule
 * Detects internal links that point to a page that itself redirects (via meta refresh).
 */
export const noRedirectChains: Rule = {
  meta: {
    id: "no-redirect-chains",
    severity: "error",
    category: "links",
    description:
      "Internal links must not point to pages that perform a client‑side redirect (meta refresh).",
    docsUrl: "https://github.com/druedaro/seo-lint#no-redirect-chains",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const anchors = querySelectorAll(doc, "a");
    for (const el of anchors) {
      const href = getAttribute(el, "href");
      if (!href) continue;
      const raw = href.trim();

      // Skip external and protocol‑relative URLs as before
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("/")) continue;
      if (raw.startsWith("//")) continue;

      // Clean query and hash
      const cleanHref = raw.split(/[?#]/)[0];
      if (!cleanHref) continue;

      const baseDir = path.dirname(ctx.filePath);
      const resolvedPath = path.normalize(
        path.isAbsolute(cleanHref) ? cleanHref.slice(1) : path.join(baseDir, cleanHref)
      );

      // If target does not exist we let the other rule handle it
      if (!ctx.allFiles.includes(resolvedPath)) continue;

      // Retrieve target file content if possible
      const targetContent = ctx.getFileContent?.(resolvedPath);
      if (!targetContent) continue;

      // Simple detection of meta refresh
      const hasMetaRefresh = /<meta\s+[^>]*http-equiv\s*=\s*(["'])refresh\1/i.test(targetContent);
      if (hasMetaRefresh) {
        const loc = getLocation(el);
        findings.push({
          ruleId: "no-redirect-chains",
          severity: noRedirectChains.meta.severity,
          category: noRedirectChains.meta.category,
          message: `Internal link "${href}" points to a page that redirect via meta refresh.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }
    return findings;
  },
};
