import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { hreflangReciprocal } from "../../src/rules/hreflang-reciprocal.js";
import { lintFiles } from "../../src/engine.js";
import type { RuleContext } from "../../src/types.js";

function makeCtx(
  html: string,
  filePath = "es/index.html",
  filesMap?: Record<string, string>,
  isMultiLang = true,
): RuleContext {
  return {
    filePath,
    html,
    allFiles: filesMap ? Object.keys(filesMap) : [filePath],
    isMultiLang,
    getFileContent: filesMap ? (p: string) => filesMap[p] ?? filesMap[p.replace(/^\//, "")] : undefined,
  };
}

function run(html: string, filePath = "es/index.html", filesMap?: Record<string, string>) {
  const doc = parseHtml(html);
  return hreflangReciprocal.check(doc, makeCtx(html, filePath, filesMap));
}

describe("hreflang-reciprocal", () => {
  describe("appliesTo", () => {
    it("returns false for monolingual site without hreflang", () => {
      const ctx = makeCtx("<html><head></head></html>", "index.html", undefined, false);
      expect(hreflangReciprocal.appliesTo?.(ctx)).toBe(false);
    });

    it("returns true when isMultiLang is true", () => {
      const ctx = makeCtx("<html><head></head></html>", "index.html", undefined, true);
      expect(hreflangReciprocal.appliesTo?.(ctx)).toBe(true);
    });
  });

  describe("check", () => {
    it("passes when target page has a reciprocal link back", () => {
      const pageEs = `<html>
<head>
  <link rel="canonical" href="https://example.com/es/">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body></body>
</html>`;

      const pageEn = `<html>
<head>
  <link rel="canonical" href="https://example.com/en/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
</head>
<body></body>
</html>`;

      const filesMap = {
        "es/index.html": pageEs,
        "en/index.html": pageEn,
        "en/": pageEn,
      };

      expect(run(pageEs, "es/index.html", filesMap)).toEqual([]);
    });

    it("passes when getFileContent is not provided (standalone file check)", () => {
      const pageEs = `<html>
<head>
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
</html>`;
      expect(run(pageEs, "es/index.html")).toEqual([]);
    });

    it("passes when target link is x-default", () => {
      const pageEs = `<html>
<head>
  <link rel="alternate" hreflang="x-default" href="https://example.com/">
</head>
</html>`;
      const filesMap = {
        "es/index.html": pageEs,
      };
      expect(run(pageEs, "es/index.html", filesMap)).toEqual([]);
    });

    it("reports error when target page does not link back to source page", () => {
      const pageEs = `<html>
<head>
  <link rel="canonical" href="https://example.com/es/">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body></body>
</html>`;

      const pageEnWithoutBacklink = `<html>
<head>
  <link rel="canonical" href="https://example.com/en/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/">
</head>
<body></body>
</html>`;

      const filesMap = {
        "es/index.html": pageEs,
        "en/index.html": pageEnWithoutBacklink,
        "en/": pageEnWithoutBacklink,
      };

      const findings = run(pageEs, "es/index.html", filesMap);
      expect(findings).toHaveLength(1);
      expect(findings[0]?.severity).toBe("error");
      expect(findings[0]?.message).toMatch(/Missing reciprocal hreflang tag/);
      expect(findings[0]?.message).toContain("https://example.com/en/");
      expect(findings[0]?.line).toBe(5);
    });

    it("integrates with lintFiles across multi-page audits", () => {
      const pageEs = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Título en Español Válido</title>
  <meta name="description" content="Descripción válida en español con suficiente longitud para superar el mínimo.">
  <link rel="canonical" href="https://example.com/es/">
  <meta property="og:title" content="Título en Español">
  <meta property="og:description" content="Descripción válida en español con suficiente longitud.">
  <meta property="og:image" content="https://example.com/img.jpg">
  <link rel="alternate" hreflang="es" href="https://example.com/es/">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body>
  <h1>Encabezado Principal</h1>
</body>
</html>`;

      const pageEnMissingReciprocal = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Valid English Page Title Here</title>
  <meta name="description" content="Valid English meta description that is long enough to pass the minimum threshold.">
  <link rel="canonical" href="https://example.com/en/">
  <meta property="og:title" content="Valid English Page Title">
  <meta property="og:description" content="Valid English meta description that is long enough to pass.">
  <meta property="og:image" content="https://example.com/img.jpg">
  <link rel="alternate" hreflang="en" href="https://example.com/en/">
</head>
<body>
  <h1>Main Heading</h1>
</body>
</html>`;

      const result = lintFiles(
        [
          { filePath: "es/index.html", html: pageEs },
          { filePath: "en/index.html", html: pageEnMissingReciprocal },
        ],
        {
          allFiles: ["es/index.html", "en/index.html"],
          isMultiLang: true,
        },
      );

      const reciprocalFinding = result.findings.find((f) => f.ruleId === "hreflang-reciprocal");
      expect(reciprocalFinding).toBeDefined();
      expect(reciprocalFinding?.filePath).toBe("es/index.html");
    });
  });
});
