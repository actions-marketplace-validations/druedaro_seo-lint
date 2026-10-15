import { describe, it, expect } from "vitest";
import { lintFile, lintFiles } from "../src/engine.js";

const GOOD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>A Perfectly Valid Page Title Here</title>
  <meta name="description" content="This is a perfectly valid meta description that is long enough to pass the minimum threshold.">
  <link rel="canonical" href="https://example.com/">
</head>
<body>
  <h1>Main Heading</h1>
  <p>Content goes here.</p>
</body>
</html>`;

const BAD_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <h2>No h1, no title, no description</h2>
</body>
</html>`;

describe("engine", () => {
  describe("lintFile", () => {
    it("produces no findings for well-formed HTML", () => {
      const findings = lintFile({
        filePath: "index.html",
        html: GOOD_HTML,
        allFiles: ["index.html"],
        isMultiLang: false,
      });
      expect(findings).toEqual([]);
    });

    it("produces findings for HTML missing title, description and h1", () => {
      const findings = lintFile({
        filePath: "bad.html",
        html: BAD_HTML,
        allFiles: ["bad.html"],
        isMultiLang: false,
      });

      const ruleIds = findings.map((f) => f.ruleId);
      expect(ruleIds).toContain("title-present");
      expect(ruleIds).toContain("description-present");
      expect(ruleIds).toContain("single-h1");
    });

    it("all findings reference the correct filePath", () => {
      const findings = lintFile({
        filePath: "pages/about.html",
        html: BAD_HTML,
        allFiles: ["pages/about.html"],
        isMultiLang: false,
      });

      for (const f of findings) {
        expect(f.filePath).toBe("pages/about.html");
      }
    });

    it("respects rule config: disable a rule with 'off'", () => {
      const findings = lintFile({
        filePath: "bad.html",
        html: BAD_HTML,
        allFiles: ["bad.html"],
        isMultiLang: false,
        config: {
          rules: { "title-present": "off" },
        },
      });

      const ruleIds = findings.map((f) => f.ruleId);
      expect(ruleIds).not.toContain("title-present");
      expect(ruleIds).toContain("description-present");
    });

    it("respects severity override from config", () => {
      const findings = lintFile({
        filePath: "bad.html",
        html: BAD_HTML,
        allFiles: ["bad.html"],
        isMultiLang: false,
        config: {
          rules: { "single-h1": "error" },
        },
      });

      const h1Finding = findings.find((f) => f.ruleId === "single-h1");
      expect(h1Finding).toBeDefined();
      expect(h1Finding!.severity).toBe("error");
    });
  });

  describe("lintFiles", () => {
    it("aggregates findings across multiple files", () => {
      const result = lintFiles(
        [
          { filePath: "good.html", html: GOOD_HTML },
          { filePath: "bad.html", html: BAD_HTML },
        ],
        {
          allFiles: ["good.html", "bad.html"],
          isMultiLang: false,
        },
      );

      expect(result.filesAnalysed).toBe(2);
      expect(result.hasErrors).toBe(true);
      expect(result.findings.length).toBeGreaterThanOrEqual(3);
      expect(result.findings.every((f) => f.filePath === "bad.html")).toBe(
        true,
      );
    });

    it("reports hasErrors=false when only warnings exist", () => {
      const result = lintFiles(
        [{ filePath: "bad.html", html: BAD_HTML }],
        {
          allFiles: ["bad.html"],
          isMultiLang: false,
          config: {
            rules: {
              "title-present": "warning",
              "description-present": "warning",
              "single-h1": "warning",
              "canonical-present": "warning",
            },
          },
        },
      );

      expect(result.hasErrors).toBe(false);
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });
});
