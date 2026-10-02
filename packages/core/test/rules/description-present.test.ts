import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { descriptionPresent } from "../../src/rules/description-present.js";
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
  return descriptionPresent.check(doc, makeCtx(html));
}

describe("description-present", () => {
  it("passes with a valid description (50–160 chars)", () => {
    const desc = "A".repeat(80);
    const html = `<html><head><meta name="description" content="${desc}"></head><body></body></html>`;
    expect(run(html)).toEqual([]);
  });

  it("reports when meta description is missing", () => {
    const html = "<html><head></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.ruleId).toBe("description-present");
    expect(findings[0]!.message).toMatch(/Missing/);
  });

  it("reports when meta description content is empty", () => {
    const html =
      '<html><head><meta name="description" content=""></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/empty/i);
  });

  it("reports when description is too short (< 50 chars)", () => {
    const html =
      '<html><head><meta name="description" content="Short desc"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/too short/i);
  });

  it("reports when description is too long (> 160 chars)", () => {
    const desc = "A".repeat(170);
    const html = `<html><head><meta name="description" content="${desc}"></head><body></body></html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/too long/i);
  });

  it("passes at exactly 50 chars (lower boundary)", () => {
    const desc = "A".repeat(50);
    const html = `<html><head><meta name="description" content="${desc}"></head><body></body></html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes at exactly 160 chars (upper boundary)", () => {
    const desc = "A".repeat(160);
    const html = `<html><head><meta name="description" content="${desc}"></head><body></body></html>`;
    expect(run(html)).toEqual([]);
  });

  it("is case-insensitive for the name attribute", () => {
    const desc = "A".repeat(80);
    const html = `<html><head><meta name="Description" content="${desc}"></head><body></body></html>`;
    expect(run(html)).toEqual([]);
  });

  it("ignores other meta tags (e.g. keywords)", () => {
    const html =
      '<html><head><meta name="keywords" content="seo"></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/Missing/);
  });
});
