// Rule: sitemap-valid-urls
// Ensures that URLs listed in sitemap.xml correspond to existing files in the dist folder.
import type { Rule, RuleContext, Finding, RuleMeta } from "../types.js";

const meta: RuleMeta = {
  id: "sitemap-valid-urls",
  severity: "error",
  category: "sitemap",
  description: "All URLs in sitemap.xml must map to an existing file in the analysed dist folder",
};

/** Extract URLs from a sitemap XML string. */
function extractSitemapUrls(content: string): string[] {
  const urls: string[] = [];
  const urlRegex = /<loc>([^<]*)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

function check(_: any, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];
  if (!ctx.getFileContent) return findings;
  const sitemap = ctx.getFileContent("sitemap.xml");
  if (!sitemap) return findings;
  const sitemapUrls = extractSitemapUrls(sitemap);
  const allFilesSet = new Set(ctx.allFiles.map(normalizeUrl));
  for (const url of sitemapUrls) {
    const path = normalizeUrl(url);
    if (!allFilesSet.has(path)) {
      findings.push({
        ruleId: meta.id,
        severity: meta.severity,
        category: meta.category,
        message: `Sitemap URL "${url}" does not correspond to any file in the dist folder`,
        filePath: "sitemap.xml",
      });
    }
  }
  return findings;
}

export const sitemapValidUrls: Rule = {
  meta,
  check,
};
