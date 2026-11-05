import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { landmarkMainPresent } from "../../src/rules/landmark-main-present.js";
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
  return landmarkMainPresent.check(doc, makeCtx(html));
}

describe("landmark-main-present", () => {
  it("passes when document has a single visible <main> tag", () => {
    const html =
      "<html><head></head><body><header></header><main><h1>Title</h1><p>Text</p></main><footer></footer></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("passes when document has an element with role='main'", () => {
    const html =
      '<html><head></head><body><header></header><div role="main"><h1>Title</h1></div></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("ignores hidden main elements when a visible main exists", () => {
    const html =
      '<html><head></head><body><main hidden></main><main><h1>Visible Main</h1></main></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("reports warning when document is missing a main landmark", () => {
    const html =
      "<html><head></head><body><header></header><div><h1>Just text</h1></div><footer></footer></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toContain("Document is missing a <main> landmark");
  });

  it("reports warning when multiple visible main landmarks exist", () => {
    const html =
      "<html><head></head><body><main><h1>Primary</h1></main><main><h2>Secondary</h2></main></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toContain("Multiple visible <main> landmarks detected");
    expect(findings[0]?.line).toBeDefined();
  });

  it("reports warning when multiple elements use role='main'", () => {
    const html =
      '<html><head></head><body><main><h1>Primary</h1></main><section role="main"><h2>Extra</h2></section></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain("Multiple visible <main> landmarks detected");
  });
});

