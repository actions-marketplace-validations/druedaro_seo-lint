import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, hasAttribute, getAttribute, getLocation, type Document } from "../parser.js";

function normalizeUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const pathname = u.pathname.length > 1 && u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
    return `${u.origin}${pathname}${u.search}`;
  } catch {
    return urlStr.trim().replace(/\/$/, "");
  }
}

function matchesSelf(hreflangHref: string, selfCanonical: string | undefined, filePath: string): boolean {
  if (selfCanonical) {
    if (normalizeUrl(hreflangHref) === normalizeUrl(selfCanonical)) return true;
    try {
      const targetParsed = new URL(hreflangHref);
      const canonicalParsed = new URL(selfCanonical);
      if (targetParsed.pathname.replace(/\/$/, "") === canonicalParsed.pathname.replace(/\/$/, "")) {
        return true;
      }
    } catch {}
  }

  const cleanFile = filePath.replace(/\/index\.html$/, "").replace(/\.html$/, "");
  const normalizedHref = hreflangHref.replace(/\/$/, "").replace(/\.html$/, "");

  if (normalizedHref.endsWith(cleanFile)) {
    return true;
  }

  return false;
}

export const hreflangSelfReference: Rule = {
  meta: {
    id: "hreflang-self-reference",
    severity: "error",
    category: "i18n",
    description: "Pages with hreflang annotations must include a self-referencing hreflang tag pointing to their own URL.",
    docsUrl: "https://developers.google.com/search/docs/specialty/international/localized-versions",
  },

  appliesTo(ctx: RuleContext): boolean {
    return ctx.isMultiLang || ctx.html.includes("hreflang");
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const links = querySelectorAll(doc, "link");

    const hreflangLinks = links.filter((el) => hasAttribute(el, "hreflang"));
    if (hreflangLinks.length === 0) return findings;

    const canonical = links.find((el) => {
      const rel = getAttribute(el, "rel");
      return rel?.toLowerCase().split(/\s+/).includes("canonical");
    });
    const canonicalHref = canonical ? getAttribute(canonical, "href")?.trim() : undefined;

    const hasSelfRef = hreflangLinks.some((link) => {
      const href = getAttribute(link, "href")?.trim();
      if (!href) return false;
      return matchesSelf(href, canonicalHref, ctx.filePath);
    });

    if (!hasSelfRef) {
      const firstLoc = getLocation(hreflangLinks[0]!);
      findings.push({
        ruleId: "hreflang-self-reference",
        severity: hreflangSelfReference.meta.severity,
        category: hreflangSelfReference.meta.category,
        message: canonicalHref
          ? `Page is missing a self-referencing hreflang tag pointing to its URL ("${canonicalHref}").`
          : "Page is missing a self-referencing hreflang tag for its own URL.",
        filePath: ctx.filePath,
        ...firstLoc,
      });
    }

    return findings;
  },
};
