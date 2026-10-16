import { describe, it, expect } from 'vitest';
import { parseHtml } from '../../src/parser.js';
import { sitemapRobotsConsistency } from '../../src/rules/sitemap-robots-consistency.js';
import type { RuleContext } from '../../src/types.js';

// Dummy HTML document (content not used by rule)
const dummyDoc = parseHtml('<html><head></head><body></body></html>');

function createCtx(files: Record<string, string>): RuleContext {
  return {
    filePath: 'test.html',
    html: '<html></html>',
    allFiles: [],
    isMultiLang: false,
    getFileContent: (path: string) => files[path],
  };
}

describe('sitemap-robots-consistency', () => {
  it('passes when sitemap URLs are not blocked by robots.txt', () => {
    const ctx = createCtx({
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\
  <url><loc>https://example.com/page1</loc></url>\
  <url><loc>https://example.com/page2</loc></url>\
</urlset>`,
      'robots.txt': 'User-agent: *\nDisallow: /private/',
    });
    const findings = sitemapRobotsConsistency.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it('fails when a sitemap URL is blocked by robots.txt', () => {
    const ctx = createCtx({
      'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\
  <url><loc>https://example.com/secret</loc></url>\
</urlset>`,
      'robots.txt': 'User-agent: *\nDisallow: /secret',
    });
    const findings = sitemapRobotsConsistency.check(dummyDoc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/blocked by robots/);
    expect(findings[0].filePath).toBe('sitemap.xml');
  });
});
