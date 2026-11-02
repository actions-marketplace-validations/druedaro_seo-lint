import type { Finding } from "@seo-lint/core";

export interface RepeatedBrokenLink {
  href: string;
  count: number;
}

export function getRepeatedBrokenLinks(
  findings: Finding[],
  threshold = 3,
): RepeatedBrokenLink[] {
  const brokenLinksByHref = new Map<string, Set<string>>();

  for (const f of findings) {
    if (f.ruleId === "no-broken-internal-links") {
      const match = f.message.match(/Internal link "([^"]+)"/);
      const href = match?.[1];
      if (href) {
        const files = brokenLinksByHref.get(href) ?? new Set<string>();
        files.add(f.filePath);
        brokenLinksByHref.set(href, files);
      }
    }
  }

  const result: RepeatedBrokenLink[] = [];
  for (const [href, files] of brokenLinksByHref) {
    if (files.size >= threshold) {
      result.push({ href, count: files.size });
    }
  }

  return result;
}

