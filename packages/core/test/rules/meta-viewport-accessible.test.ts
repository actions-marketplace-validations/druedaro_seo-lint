import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { metaViewportAccessible } from "../../src/rules/meta-viewport-accessible.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(html: string): RuleContext {
  return {
    filePath: "index.html",
    html,
    allFiles: ["index.html"],
    isMultiLang: false,
  };
}

function run(html: string) {
  const doc = parseHtml(html);
  return metaViewportAccessible.check(doc, makeCtx(html));
}

describe("meta-viewport-accessible", () => {
  it("passes with standard mobile-friendly viewport tag", () => {
    const html =
      '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes when maximum-scale is 2.0 or higher", () => {
    const html =
      '<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("reports warning when viewport meta tag is missing", () => {
    const html = "<html><head><title>Page</title></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toContain("Document is missing a <meta name=\"viewport\"> tag.");
  });

  it("reports warning when viewport meta tag has empty content", () => {
    const html = '<html><head><meta name="viewport" content=""></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('tag is missing a "content" attribute');
    expect(findings[0]?.line).toBeDefined();
  });

  it("reports warning when user-scalable=no is set", () => {
    const html =
      '<html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("disables pinch-to-zoom with \"user-scalable=no\"");
  });

  it("reports warning when user-scalable=0 is set", () => {
    const html =
      '<html><head><meta name="viewport" content="width=device-width, user-scalable=0"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("disables pinch-to-zoom");
  });

  it("reports warning when maximum-scale is less than 2", () => {
    const html =
      '<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("restricts zoom with \"maximum-scale=1.0\"");
  });
});

