import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { headingOrder } from "../../src/rules/heading-order.js";
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
  return headingOrder.check(doc, makeCtx(html));
}

describe("heading-order", () => {
  it("passes with correct hierarchical order", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h2>Section</h2>
  <h3>Subsection</h3>
  <h2>Another Section</h2>
  <h3>Subsection</h3>
</body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when repeated headings are at the same level", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h2>Section 1</h2>
  <h2>Section 2</h2>
  <h3>Subsection A</h3>
  <h3>Subsection B</h3>
</body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when skipping levels upward (closing sub-sections)", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h2>Section</h2>
  <h3>Sub</h3>
  <h4>Subsub</h4>
  <h2>Back to top level</h2>
</body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when there are no headings", () => {
    const html = "<html><body><p>No headings here</p></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("reports warning when first heading is not h1", () => {
    const html = `<html>
<body>
  <h2>Section First</h2>
  <p>Content</p>
</body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toMatch(/First heading on the page is <h2>, expected <h1>/);
  });

  it("reports warning when skipping from h1 to h3", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h3>Skipped h2</h3>
</body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toMatch(/Heading level skipped: <h1> is followed by <h3> without an <h2>/);
  });

  it("reports warning when skipping from h2 to h4", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h2>Section</h2>
  <h4>Skipped h3</h4>
</body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/Heading level skipped: <h2> is followed by <h4> without an <h3>/);
  });

  it("reports multiple warnings for multiple skips", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h3>Skip 1</h3>
  <h5>Skip 2</h5>
</body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(2);
  });

  it("includes source line and column", () => {
    const html = `<html>
<body>
  <h1>Title</h1>
  <h4>Skipped</h4>
</body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(4);
    expect(findings[0]?.column).toBeDefined();
  });
});
