import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { langAttribute } from "../../src/rules/lang-attribute.js";
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
  return langAttribute.check(doc, makeCtx(html));
}

describe("lang-attribute", () => {
  it("passes with simple 2-letter BCP 47 code", () => {
    const html = '<html lang="en"><head></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes with language and region (e.g. es-ES, en-US)", () => {
    const html = '<html lang="es-ES"><head></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes with language, script and region (e.g. zh-Hans-CN)", () => {
    const html = '<html lang="zh-Hans-CN"><head></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes when attribute name is uppercase or mixed case", () => {
    const html = '<html LANG="fr"><head></head><body></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("reports error when <html> has no lang attribute", () => {
    const html = "<html><head></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/missing a "lang" attribute/);
  });

  it("reports error when lang attribute is empty or whitespace", () => {
    const html = '<html lang="   "><head></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/is empty/);
  });

  it("reports error when POSIX locale format with underscore is used (es_ES)", () => {
    const html = '<html lang="es_ES"><head></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/not a valid BCP 47/);
  });

  it("reports error for invalid language codes", () => {
    const html = '<html lang="12345"><head></head><body></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/not a valid BCP 47/);
  });

  it("includes source line and column", () => {
    const html = `<!DOCTYPE html>
<html>
<head></head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.column).toBeDefined();
  });
});
