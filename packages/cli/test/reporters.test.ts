import { describe, it, expect } from "vitest";
import type { LintResult } from "@seo-lint/core";
import {
  formatTextReport,
  formatJsonReport,
  formatGithubReport,
} from "../src/reporters/index.js";

const EMPTY_RESULT: LintResult = {
  findings: [],
  filesAnalysed: 3,
  hasErrors: false,
};

const SAMPLE_RESULT: LintResult = {
  findings: [
    {
      ruleId: "title-present",
      severity: "error",
      category: "meta",
      message: "Missing title tag",
      filePath: "dist/index.html",
      line: 1,
      column: 1,
    },
    {
      ruleId: "description-present",
      severity: "warning",
      category: "meta",
      message: "Description is too short",
      filePath: "dist/about.html",
    },
  ],
  filesAnalysed: 2,
  hasErrors: true,
};

describe("cli reporters", () => {
  describe("text reporter", () => {
    it("formats clean result with checkmark", () => {
      const output = formatTextReport(EMPTY_RESULT);
      expect(output).toContain("No SEO or GEO problems found across 3 files.");
    });

    it("formats findings grouped by file with totals", () => {
      const output = formatTextReport(SAMPLE_RESULT);
      expect(output).toContain("dist/index.html");
      expect(output).toContain("Missing title tag");
      expect(output).toContain("title-present");
      expect(output).toContain("dist/about.html");
      expect(output).toContain("Description is too short");
      expect(output).toContain("2 problems (1 error, 1 warning)");
    });
  });

  describe("json reporter", () => {
    it("outputs valid json string representing LintResult", () => {
      const output = formatJsonReport(SAMPLE_RESULT);
      const parsed = JSON.parse(output);
      expect(parsed.filesAnalysed).toBe(2);
      expect(parsed.hasErrors).toBe(true);
      expect(parsed.findings).toHaveLength(2);
    });
  });

  describe("github reporter", () => {
    it("formats github workflow commands for annotations", () => {
      const output = formatGithubReport(SAMPLE_RESULT);
      expect(output).toContain(
        "::error file=dist/index.html,line=1,col=1::dist/index.html: [title-present] Missing title tag"
      );
      expect(output).toContain(
        "::warning file=dist/about.html::dist/about.html: [description-present] Description is too short"
      );
      expect(output).toContain("seo-lint: Found 1 error(s) and 1 warning(s) across 2 files.");
    });

    it("formats clean result for github", () => {
      const output = formatGithubReport(EMPTY_RESULT);
      expect(output).toContain("seo-lint: No SEO/GEO problems found across 3 files.");
    });
  });
});
