import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { hreflangSelfReference } from "../../src/rules/hreflang-self-reference.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(html: string, filePath = "es/index.html", isMultiLang = true): RuleContext {
  return {
    filePath,
    html,
    allFiles: [filePath],
    isMultiLang,
  };
}

function run(html: string, filePath = "es/index.html", isMultiLang = true) {
  const doc = parseHtml(html);
  return hreflangSelfReference.check(doc, makeCtx(html, filePath, isMultiLang));
}

describe("hreflang-self-reference", () => {
  describe("appliesTo", () => {
    it("returns false for monolingual site without hreflang", () => {
      const ctx = makeCtx("<html><head></head></html>", "index.html", false);
      expect(hreflangSelfReference.appliesTo?.(ctx)).toBe(false);
    });

    it("returns true when isMultiLang is true", () => {
      const ctx = makeCtx("<html><head></head></html>", "index.html", true);
      expect(hreflangSelfReference.appliesTo?.(ctx)).toBe(true);
    });

    it("returns true when html contains hreflang even if isMultiLang is false", () => {
      const ctx = makeCtx('<html><head><link rel="alternate" hreflang="es" href="/"></head></html>', "index.html", false);
      expect(hreflangSelfReference.appliesTo?.(ctx)).toBe(true);
    });
  });

  describe("check", () => {
    it("passes when hreflang includes self-reference matching canonical URL", () => {
      const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/es/">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
  <link rel="alternate" hreflang="x-default" href="https://example.com/">
</head>
<body></body>
</html>`;
      expect(run(html, "es/index.html")).toEqual([]);
    });

    it("passes when trailing slashes differ between canonical and hreflang", () => {
      const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/es">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body></body>
</html>`;
      expect(run(html, "es/index.html")).toEqual([]);
    });

    it("passes when there are no hreflang links", () => {
      const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/">
</head>
<body></body>
</html>`;
      expect(run(html)).toEqual([]);
    });

    it("reports error when hreflang block does not include the canonical URL", () => {
      const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/">
</head>
<body></body>
</html>`;
      const findings = run(html, "es/index.html");
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe("error");
      expect(findings[0]?.message).toMatch(/missing a self-referencing hreflang tag/);
      expect(findings[0]?.message).toContain("https://example.com/es/");
    });

    it("includes line and column of the hreflang link", () => {
      const html = `<html>
<head>
  <link rel="canonical" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body></body>
</html>`;
      const findings = run(html, "es/index.html");
      expect(findings[0]?.line).toBe(4);
      expect(findings[0]?.column).toBeDefined();
    });
  });
});
