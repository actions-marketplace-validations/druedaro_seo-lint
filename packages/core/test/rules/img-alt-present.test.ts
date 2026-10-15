import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { imgAltPresent } from "../../src/rules/img-alt-present.js";
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
  return imgAltPresent.check(doc, makeCtx(html));
}

describe("img-alt-present", () => {
  it("passes when image has descriptive alt text", () => {
    const html = '<html><body><img src="product.jpg" alt="Blue cotton t-shirt"></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes for decorative images with alt=\"\"", () => {
    const html = '<html><body><img src="divider.png" alt=""></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes when alt attribute is uppercase or mixed case", () => {
    const html = '<html><body><img src="logo.png" ALT="Company logo"></body></html>';
    expect(run(html)).toEqual([]);
  });

  it("passes when there are no images on the page", () => {
    const html = "<html><body><p>Text only</p></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("reports warning when image is missing alt attribute", () => {
    const html = '<html><body><img src="photo.jpg"></body></html>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toMatch(/missing an "alt" attribute/);
    expect(findings[0]?.message).toContain('photo.jpg');
  });

  it("reports warning when image has no src and no alt", () => {
    const html = "<html><body><img></body></html>";
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toBe('Image is missing an "alt" attribute.');
  });

  it("reports multiple warnings for multiple images missing alt", () => {
    const html = `<html>
<body>
  <img src="one.jpg">
  <img src="two.jpg" alt="Valid alt">
  <img src="three.jpg">
</body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(2);
    expect(findings[0]?.message).toContain("one.jpg");
    expect(findings[1]?.message).toContain("three.jpg");
  });

  it("includes source line and column", () => {
    const html = `<html>
<body>
  <img src="photo.jpg">
</body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(3);
    expect(findings[0]?.column).toBeDefined();
  });
});
