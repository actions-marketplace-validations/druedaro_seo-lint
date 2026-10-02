import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { titlePresent } from "../../src/rules/title-present.js";
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
  return titlePresent.check(doc, makeCtx(html));
}

describe("title-present", () => {
  it("passes with a valid title (10–60 chars)", () => {
    const html =
      "<html><head><title>A Perfectly Valid Page Title</title></head><body></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("reports error when <title> is missing", () => {
    const html = "<html><head></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe("title-present");
    expect(findings[0]!.message).toMatch(/Missing/);
    expect(findings[0]!.severity).toBe("error");
  });

  it("reports error when <title> is empty", () => {
    const html = "<html><head><title></title></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/empty/i);
  });

  it("reports error when <title> is only whitespace", () => {
    const html = "<html><head><title>   </title></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/empty/i);
  });

  it("reports error when title is too short (< 10 chars)", () => {
    const html = "<html><head><title>Hi</title></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/too short/i);
    expect(findings[0]!.message).toContain("2 chars");
  });

  it("reports warning when title is too long (> 60 chars)", () => {
    const longTitle = "A".repeat(65);
    const html = `<html><head><title>${longTitle}</title></head><body></body></html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe("warning");
    expect(findings[0]!.message).toMatch(/too long/i);
  });

  it("passes at exactly 10 chars (lower boundary)", () => {
    const html =
      "<html><head><title>Exactly 10</title></head><body></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("passes at exactly 60 chars (upper boundary)", () => {
    const title = "A".repeat(60);
    const html = `<html><head><title>${title}</title></head><body></body></html>`;
    expect(run(html)).toEqual([]);
  });

  it("includes line/column info when available", () => {
    const html =
      "<html>\n<head>\n<title></title>\n</head>\n<body></body>\n</html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.line).toBeDefined();
    expect(findings[0]!.column).toBeDefined();
  });
});
