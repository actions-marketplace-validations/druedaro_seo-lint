import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, hasAttribute, getAttribute, getLocation, parseHtml, type Document } from "../parser.js";

function normalizeUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const pathname = u.pathname.length > 1 && u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
    return `${u.origin}${pathname}${u.search}`;
  } catch {
    return urlStr.trim().replace(/\/$/, "");
  }
}

function extractPath(href: string): string {
  try {
    const u = new URL(href);
    return u.pathname;
  } catch {
    return href;
  }
}

function matchesPage(targetHref: string, canonicalHref: string | undefined, filePath: string): boolean {
  if (canonicalHref) {
    if (normalizeUrl(targetHref) === normalizeUrl(canonicalHref)) return true;
    try {
      const targetParsed = new URL(targetHref);
      const canonicalParsed = new URL(canonicalHref);
      if (targetParsed.pathname.replace(/\/$/, "") === canonicalParsed.pathname.replace(/\/$/, "")) {
        return true;
      }
    } catch {
      // not a full URL
    }
  }

  const cleanFile = filePath.replace(/\/index\.html$/, "").replace(/\.html$/, "").replace(/^\//, "");
  const normalizedHref = targetHref.replace(/\/$/, "").replace(/\.html$/, "").replace(/^\//, "");

  return normalizedHref.endsWith(cleanFile);
}

export const hreflangReciprocal: Rule = {
  meta: {
    id: "hreflang-reciprocal",
    severity: "error",
    category: "i18n",
    description: "Alternate hreflang links must be reciprocal (if page A links to page B, page B must link back to page A).",
    docsUrl: "https://developers.google.com/search/docs/specialty/international/localized-versions",
  },

  appliesTo(ctx: RuleContext): boolean {
    return ctx.isMultiLang || ctx.html.includes("hreflang");
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    if (!ctx.getFileContent) return findings;

    const links = querySelectorAll(doc, "link");
    const hreflangLinks = links.filter((el) => hasAttribute(el, "hreflang"));
    if (hreflangLinks.length === 0) return findings;

    const canonical = links.find((el) => {
      const rel = getAttribute(el, "rel");
      return rel?.toLowerCase().split(/\s+/).includes("canonical");
    });
    const canonicalHref = canonical ? getAttribute(canonical, "href")?.trim() : undefined;

    for (const link of hreflangLinks) {
      const targetHref = getAttribute(link, "href")?.trim();
      const targetLang = getAttribute(link, "hreflang")?.trim().toLowerCase();

      if (!targetHref || targetLang === "x-default") continue;

      if (matchesPage(targetHref, canonicalHref, ctx.filePath)) continue;

      const targetPath = extractPath(targetHref);
      const targetHtml = ctx.getFileContent(targetPath);
      if (!targetHtml) continue;

      const targetDoc = parseHtml(targetHtml);
      const targetHreflangLinks = querySelectorAll(targetDoc, "link").filter((el) => hasAttribute(el, "hreflang"));

      const hasReturnLink = targetHreflangLinks.some((targetLink) => {
        const returnHref = getAttribute(targetLink, "href")?.trim();
        if (!returnHref) return false;
        return matchesPage(returnHref, canonicalHref, ctx.filePath);
      });

      if (!hasReturnLink) {
        const loc = getLocation(link);
        findings.push({
          ruleId: "hreflang-reciprocal",
          severity: hreflangReciprocal.meta.severity,
          category: hreflangReciprocal.meta.category,
          message: `Missing reciprocal hreflang tag: "${targetHref}" does not point back to this page.`,
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};
