// Rule: sitemap-robots-consistency
// Ensures that URLs listed in sitemap.xml are not blocked by robots.txt Disallow rules.
import type { Rule, RuleContext, Finding, RuleMeta } from "../types.js";

const meta: RuleMeta = {
  id: "sitemap-robots-consistency",
  severity: "error",
  category: "sitemap",
  description: "URLs listed in sitemap.xml must not be blocked by robots.txt",
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

/** Extract Disallow paths from robots.txt content. */
function extractDisallowPaths(content: string): string[] {
  const paths: string[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Disallow:/i.test(trimmed)) {
      const path = trimmed.split(":")[1]?.trim();
      if (path) paths.push(path);
    }
  }
  return paths;
}

function check(_: any, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];
  if (!ctx.getFileContent) return findings;
  const sitemap = ctx.getFileContent("sitemap.xml");
  const robots = ctx.getFileContent("robots.txt");
  if (!sitemap || !robots) return findings;
  const sitemapUrls = extractSitemapUrls(sitemap);
  const disallow = extractDisallowPaths(robots);
  const normalize = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname;
    } catch {
      return url.startsWith('/') ? url : `/${url}`;
    }
  };
  const disallowedSet = new Set(disallow.map(normalize));
  for (const url of sitemapUrls) {
    const path = normalize(url);
    if (disallowedSet.has(path)) {
      findings.push({
        ruleId: meta.id,
        severity: meta.severity,
        category: meta.category,
        message: `Sitemap URL "${url}" is blocked by robots.txt`,
        filePath: "sitemap.xml",
      });
    }
  }
  return findings;
}

export const sitemapRobotsConsistency: Rule = {
  meta,
  check,
};
