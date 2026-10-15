import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { hreflangValidCodes } from "../../src/rules/hreflang-valid-codes.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(html: string, isMultiLang = true): RuleContext {
  return {
    filePath: "index.html",
    html,
    allFiles: ["index.html"],
    isMultiLang,
  };
}

function run(html: string, isMultiLang = true) {
  const doc = parseHtml(html);
  return hreflangValidCodes.check(doc, makeCtx(html, isMultiLang));
}

describe("hreflang-valid-codes", () => {
  describe("appliesTo", () => {
    it("returns false for monolingual site without hreflang in html", () => {
      const ctx = makeCtx("<html><head><title>Title</title></head></html>", false);
      expect(hreflangValidCodes.appliesTo?.(ctx)).toBe(false);
    });

    it("returns true when isMultiLang is true", () => {
      const ctx = makeCtx("<html><head></head></html>", true);
      expect(hreflangValidCodes.appliesTo?.(ctx)).toBe(true);
    });

    it("returns true when html contains hreflang even if isMultiLang is false", () => {
      const ctx = makeCtx('<html><head><link rel="alternate" hreflang="es" href="/"></head></html>', false);
      expect(hreflangValidCodes.appliesTo?.(ctx)).toBe(true);
    });
  });

  describe("check", () => {
    it("passes with valid language codes (en, es-ES, zh-Hans-CN, x-default)", () => {
      const html = `<html>
<head>
  <link rel="alternate" hreflang="en" href="https://example.com/en">
  <link rel="alternate" hreflang="es-ES" href="https://example.com/es">
  <link rel="alternate" hreflang="zh-Hans-CN" href="https://example.com/zh">
  <link rel="alternate" hreflang="x-default" href="https://example.com/">
</head>
<body></body>
</html>`;
      expect(run(html)).toEqual([]);
    });

    it("passes with case-insensitive x-default", () => {
      const html = '<html><head><link rel="alternate" hreflang="X-Default" href="https://example.com/"></head></html>';
      expect(run(html)).toEqual([]);
    });

    it("reports error when hreflang attribute is empty or whitespace", () => {
      const html = '<html><head><link rel="alternate" hreflang="   " href="https://example.com/"></head></html>';
      const findings = run(html);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe("error");
      expect(findings[0]?.message).toMatch(/empty "hreflang" attribute/);
    });

    it("reports error when POSIX locale format with underscore is used (es_ES)", () => {
      const html = '<html><head><link rel="alternate" hreflang="es_ES" href="https://example.com/es"></head></html>';
      const findings = run(html);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe("error");
      expect(findings[0]?.message).toMatch(/Invalid hreflang code "es_ES"/);
    });

    it("reports error for invalid language code syntax", () => {
      const html = '<html><head><link rel="alternate" hreflang="12345" href="https://example.com/"></head></html>';
      const findings = run(html);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe("error");
      expect(findings[0]?.message).toMatch(/Invalid hreflang code "12345"/);
    });

    it("includes line and column source location", () => {
      const html = `<html>
<head>
  <link rel="alternate" hreflang="invalid_code" href="https://example.com/">
</head>
</html>`;
      const findings = run(html);
      expect(findings[0]?.line).toBe(3);
      expect(findings[0]?.column).toBeDefined();
    });
  });
});
