import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { singleH1 } from "../../src/rules/single-h1.js";
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
  return singleH1.check(doc, makeCtx(html));
}

describe("single-h1", () => {
  it("passes with exactly one h1", () => {
    const html =
      "<html><head></head><body><h1>Main Heading</h1></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("reports when h1 is missing", () => {
    const html = "<html><head></head><body><h2>Sub</h2></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe("single-h1");
    expect(findings[0]!.message).toMatch(/missing/i);
  });

  it("reports each extra h1 when there are multiple", () => {
    const html =
      "<html><head></head><body><h1>First</h1><h1>Second</h1><h1>Third</h1></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(2);
    expect(findings[0]!.message).toContain("Second");
    expect(findings[1]!.message).toContain("Third");
  });

  it("reports when the single h1 is empty", () => {
    const html = "<html><head></head><body><h1></h1></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/empty/i);
  });

  it("reports when h1 contains only whitespace", () => {
    const html = "<html><head></head><body><h1>   </h1></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/empty/i);
  });

  it("passes with h1 containing nested elements", () => {
    const html =
      "<html><head></head><body><h1><span>Nested</span> Heading</h1></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("truncates long h1 text in the error message", () => {
    const longText = "A".repeat(50);
    const html = `<html><head></head><body><h1>First</h1><h1>${longText}</h1></body></html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain("…");
  });
});
