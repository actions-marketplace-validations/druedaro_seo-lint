import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { ogTagsComplete } from "../../src/rules/og-tags-complete.js";
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
  return ogTagsComplete.check(doc, makeCtx(html));
}

describe("og-tags-complete", () => {
  it("passes with complete and valid og:title, og:description, and og:image", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="My Page Title">
  <meta property="og:description" content="My page description for social sharing.">
  <meta property="og:image" content="https://example.com/assets/share.jpg">
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when using name attribute instead of property attribute", () => {
    const html = `<html>
<head>
  <meta name="og:title" content="My Page Title">
  <meta name="og:description" content="My page description.">
  <meta name="og:image" content="https://example.com/og.png">
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when property name has mixed case", () => {
    const html = `<html>
<head>
  <meta property="OG:Title" content="Title">
  <meta property="OG:Description" content="Description">
  <meta property="OG:Image" content="https://example.com/og.png">
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("reports warning when all OG tags are missing", () => {
    const html = "<html><head></head><body></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.severity === "warning")).toBe(true);
    expect(findings.map((f) => f.message)).toEqual([
      'Missing <meta property="og:title"> tag.',
      'Missing <meta property="og:description"> tag.',
      'Missing <meta property="og:image"> tag.',
    ]);
  });

  it("reports warning when only og:image is missing", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="Title">
  <meta property="og:description" content="Description">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/Missing <meta property="og:image">/);
  });

  it("reports warning when a tag has empty or whitespace content", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="   ">
  <meta property="og:description" content="Desc">
  <meta property="og:image" content="https://example.com/img.jpg">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/The "og:title" tag has empty content/);
  });

  it("reports warning when og:image is a relative URL", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="Title">
  <meta property="og:description" content="Desc">
  <meta property="og:image" content="/images/og.jpg">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/must be a valid absolute URL/);
  });

  it("reports warning when og:image uses a non-http(s) protocol", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="Title">
  <meta property="og:description" content="Desc">
  <meta property="og:image" content="ftp://example.com/og.jpg">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/must use http or https protocol/);
  });

  it("includes source location when location info is available", () => {
    const html = `<html>
<head>
  <meta property="og:title" content="Title">
  <meta property="og:description" content="Desc">
  <meta property="og:image" content="/relative.jpg">
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(5);
    expect(findings[0]?.column).toBeDefined();
  });
});
