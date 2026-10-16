import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { noRedirectChains } from "../../src/rules/no-redirect-chains.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(filePath: string, allFiles: string[], fileMap: Record<string, string>): RuleContext {
  return {
    filePath,
    html: "",
    allFiles,
    isMultiLang: false,
    getFileContent: (p: string) => fileMap[p],
  };
}

function htmlWithLink(href: string): string {
  return `<html><head></head><body><a href="${href}">link</a></body></html>`;
}

describe("no-redirect-chains", () => {
  it("passes when target page has no meta refresh", () => {
    const fileMap = { "about.html": "<html><head></head><body>About</body></html>" };
    const ctx = makeCtx("index.html", ["index.html", "about.html"], fileMap);
    const doc = parseHtml(htmlWithLink("about.html"));
    const findings = noRedirectChains.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("fails when target page contains meta refresh", () => {
    const fileMap = {
      "redirect.html": "<html><head><meta http-equiv=\"refresh\" content=\"0;url=/new\"></head><body></body></html>",
    };
    const ctx = makeCtx("index.html", ["index.html", "redirect.html"], fileMap);
    const doc = parseHtml(htmlWithLink("redirect.html"));
    const findings = noRedirectChains.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/redirect via meta refresh/);
  });

  it("ignores external URLs", () => {
    const ctx = makeCtx("index.html", ["index.html"], {});
    const doc = parseHtml(htmlWithLink("https://example.com"));
    const findings = noRedirectChains.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("ignores missing target files (handled by other rule)", () => {
    const ctx = makeCtx("index.html", ["index.html"], {});
    const doc = parseHtml(htmlWithLink("missing.html"));
    const findings = noRedirectChains.check(doc, ctx);
    expect(findings).toHaveLength(0);
  });
});
