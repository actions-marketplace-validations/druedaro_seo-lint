import { describe, it, expect } from 'vitest';
import { parseHtml } from '../../src/parser.js';
import { sitemapValidUrls } from '../../src/rules/sitemap-valid-urls.js';
import type { RuleContext } from '../../src/types.js';

const dummyDoc = parseHtml('<html><head></head><body></body></html>');

function createCtx(files: Record<string, string>, allFiles: string[]): RuleContext {
  return {
    filePath: 'test.html',
    html: '<html></html>',
    allFiles,
    isMultiLang: false,
    getFileContent: (path: string) => files[path],
  };
}

describe('sitemap-valid-urls', () => {
  it('passes when all sitemap URLs have corresponding files', () => {
    const ctx = createCtx(
      {
        'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\
  <url><loc>https://example.com/page1</loc></url>\
  <url><loc>https://example.com/page2</loc></url>\
</urlset>`,
      },
      ['/page1', '/page2']
    );
    const findings = sitemapValidUrls.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it('fails when a sitemap URL has no matching file', () => {
    const ctx = createCtx(
      {
        'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\
  <url><loc>https://example.com/missing</loc></url>\
</urlset>`,
      },
      ['/existing']
    );
    const findings = sitemapValidUrls.check(dummyDoc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/does not correspond/);
    expect(findings[0].filePath).toBe('sitemap.xml');
  });
});
