import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { extractableContent } from "../../src/rules/extractable-content.js";
import type { RuleContext } from "../../src/types.js";

const ctx: RuleContext = {
  filePath: "test.html",
  html: "",
  allFiles: ["test.html"],
  isMultiLang: false,
};

describe("extractable-content", () => {
  it("passes when body contains pre-rendered static content", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Main Heading</h1><p>This is pre-rendered content for search engines and AI crawlers.</p></body></html>`;
    const doc = parseHtml(html);
    const findings = extractableContent.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("warns when body is completely empty", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
    const doc = parseHtml(html);
    const findings = extractableContent.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/relies entirely on client-side/);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.category).toBe("geo");
  });

  it("warns when body only contains script and noscript tags", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><noscript>You need JavaScript to run this app.</noscript><script src="/bundle.js"></script></body></html>`;
    const doc = parseHtml(html);
    const findings = extractableContent.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/relies entirely on client-side/);
  });

  it("warns when empty SPA root container is present without pre-rendered content", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div><script src="/main.js"></script></body></html>`;
    const doc = parseHtml(html);
    const findings = extractableContent.check(doc, ctx);
    expect(findings).toHaveLength(1);
  });

  it("passes when SPA container is pre-rendered with content (SSR/SSG)", () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"><h1>SSR Page</h1><p>Full article body pre-rendered by framework generator.</p></div><script src="/bundle.js"></script></body></html>`;
    const doc = parseHtml(html);
    const findings = extractableContent.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });
});
