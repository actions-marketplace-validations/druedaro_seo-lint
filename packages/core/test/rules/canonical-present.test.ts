import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { canonicalPresent } from "../../src/rules/canonical-present.js";
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
  return canonicalPresent.check(doc, makeCtx(html));
}

describe("canonical-present", () => {
  it("passes with a valid absolute HTTPS canonical link", () => {
    const html =
      '<html><head><link rel="canonical" href="https://example.com/page"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes with a valid absolute HTTP canonical link", () => {
    const html =
      '<html><head><link rel="canonical" href="http://example.com/page"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes with uppercase or mixed-case rel attribute", () => {
    const html =
      '<html><head><link rel="Canonical" href="https://example.com/"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes when rel contains canonical among multiple values", () => {
    const html =
      '<html><head><link rel="alternate canonical" href="https://example.com/"></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("reports error when <link rel=\"canonical\"> is missing", () => {
    const html = "<html><head></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe("canonical-present");
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/Missing <link rel="canonical">/);
  });

  it("reports error when href is missing", () => {
    const html =
      '<html><head><link rel="canonical"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/missing an href attribute/);
  });

  it("reports error when href is empty or whitespace", () => {
    const html =
      '<html><head><link rel="canonical" href="   "></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/empty href attribute/);
  });

  it("reports error when canonical URL is relative (root-relative)", () => {
    const html =
      '<html><head><link rel="canonical" href="/about"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/valid absolute URL/);
  });

  it("reports error when canonical URL is relative (path-relative)", () => {
    const html =
      '<html><head><link rel="canonical" href="page.html"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/valid absolute URL/);
  });

  it("reports error when canonical URL uses a non-http(s) protocol", () => {
    const html =
      '<html><head><link rel="canonical" href="ftp://example.com/file"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/must use http or https protocol/);
  });

  it("reports error when multiple canonical links exist", () => {
    const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/one">
  <link rel="canonical" href="https://example.com/two">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/Multiple <link rel="canonical">/);
    expect(findings[0]?.line).toBe(4);
  });

  it("includes source location when location info is available", () => {
    const html = `<html>
<head>
  <link rel="canonical" href="/not-absolute">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(3);
    expect(findings[0]?.column).toBeDefined();
  });
});
