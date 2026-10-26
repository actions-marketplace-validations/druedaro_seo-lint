import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { noBrokenInternalLinks } from "../../src/rules/no-broken-internal-links.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(filePath: string, allFiles: string[]): RuleContext {
  return {
    filePath,
    html: "",
    allFiles,
    isMultiLang: false,
  };
}

function htmlWithLink(href: string): string {
  return `<html><head></head><body><a href="${href}">link</a></body></html>`;
}

describe("no-broken-internal-links", () => {
  it("passes when link points to existing file (relative)", () => {
    const ctx = makeCtx("index.html", ["index.html", "about.html"]);
    const doc = parseHtml(htmlWithLink("about.html"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("passes when link points to existing file (absolute)", () => {
    const ctx = makeCtx("pages/index.html", ["pages/index.html", "pages/contact.html"]);
    const doc = parseHtml(htmlWithLink("/pages/contact.html"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("fails when link points to missing file", () => {
    const ctx = makeCtx("index.html", ["index.html", "about.html"]);
    const doc = parseHtml(htmlWithLink("missing.html"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/missing\.html/);
  });

  it("ignores external URLs", () => {
    const ctx = makeCtx("index.html", ["index.html"]);
    const doc = parseHtml(htmlWithLink("https://example.com"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("ignores protocol‑relative URLs", () => {
    const ctx = makeCtx("index.html", ["index.html"]);
    const doc = parseHtml(htmlWithLink("//example.com/page"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("handles query strings and hash fragments", () => {
    const ctx = makeCtx("index.html", ["index.html", "page.html"]);
    const doc = parseHtml(htmlWithLink("page.html?foo=bar#section"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("resolves root link / to index.html", () => {
    const ctx = makeCtx("en/index.html", ["index.html", "en/index.html"]);
    const doc = parseHtml(htmlWithLink("/"));
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("resolves directory links /en/ and /ca/ to dir/index.html", () => {
    const ctx = makeCtx("index.html", ["index.html", "en/index.html", "ca/index.html"]);
    const doc = parseHtml(`
      <html><body>
        <a href="/en/">English</a>
        <a href="/ca/">Catalan</a>
      </body></html>
    `);
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("resolves clean URL /about to about.html or about/index.html", () => {
    const ctx = makeCtx("index.html", ["index.html", "about.html", "team/index.html"]);
    const doc = parseHtml(`
      <html><body>
        <a href="/about">About</a>
        <a href="/team">Team</a>
      </body></html>
    `);
    const findings = noBrokenInternalLinks.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });
});
