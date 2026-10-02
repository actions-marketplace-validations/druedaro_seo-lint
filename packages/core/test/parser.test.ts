import { describe, it, expect } from "vitest";
import {
  parseHtml,
  querySelector,
  querySelectorAll,
  getAttribute,
  hasAttribute,
  getTextContent,
  getLocation,
  walkElements,
} from "../src/parser.js";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Page</title>
  <meta name="description" content="A test page">
</head>
<body>
  <h1>Main <span>Heading</span></h1>
  <img src="photo.jpg" alt="A photo">
  <img src="decorative.svg" alt="">
  <h2>Section</h2>
  <p>Paragraph content.</p>
</body>
</html>`;

describe("parseHtml", () => {
  it("returns a Document node", () => {
    const doc = parseHtml(SAMPLE_HTML);
    expect(doc.nodeName).toBe("#document");
  });

  it("includes sourceCodeLocation info", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const h1 = querySelector(doc, "h1");
    expect(h1).toBeDefined();
    expect(h1!.sourceCodeLocation).toBeDefined();
  });
});

describe("querySelector", () => {
  it("finds the first matching element", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const title = querySelector(doc, "title");
    expect(title).toBeDefined();
    expect(title!.tagName).toBe("title");
  });

  it("returns undefined for non-existent tags", () => {
    const doc = parseHtml(SAMPLE_HTML);
    expect(querySelector(doc, "footer")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    const doc = parseHtml(SAMPLE_HTML);
    expect(querySelector(doc, "TITLE")).toBeDefined();
    expect(querySelector(doc, "Title")).toBeDefined();
  });
});

describe("querySelectorAll", () => {
  it("finds all matching elements", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const imgs = querySelectorAll(doc, "img");
    expect(imgs).toHaveLength(2);
  });

  it("returns empty array for non-existent tags", () => {
    const doc = parseHtml(SAMPLE_HTML);
    expect(querySelectorAll(doc, "footer")).toEqual([]);
  });
});

describe("getAttribute", () => {
  it("returns the attribute value", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const html = querySelector(doc, "html");
    expect(getAttribute(html!, "lang")).toBe("en");
  });

  it("returns undefined for missing attributes", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const html = querySelector(doc, "html");
    expect(getAttribute(html!, "data-theme")).toBeUndefined();
  });

  it("is case-insensitive for attribute names", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const html = querySelector(doc, "html");
    expect(getAttribute(html!, "LANG")).toBe("en");
  });
});

describe("hasAttribute", () => {
  it("returns true for present attributes", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const imgs = querySelectorAll(doc, "img");
    expect(hasAttribute(imgs[0]!, "alt")).toBe(true);
  });

  it("returns true for empty attributes", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const imgs = querySelectorAll(doc, "img");
    // Second img has alt=""
    expect(hasAttribute(imgs[1]!, "alt")).toBe(true);
  });

  it("returns false for missing attributes", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const h1 = querySelector(doc, "h1");
    expect(hasAttribute(h1!, "class")).toBe(false);
  });
});

describe("getTextContent", () => {
  it("returns concatenated text of element and children", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const h1 = querySelector(doc, "h1");
    expect(getTextContent(h1!)).toBe("Main Heading");
  });

  it("returns empty string for self-closing elements", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const img = querySelector(doc, "img");
    expect(getTextContent(img!)).toBe("");
  });
});

describe("getLocation", () => {
  it("returns line and column for elements", () => {
    const doc = parseHtml(SAMPLE_HTML);
    const h1 = querySelector(doc, "h1");
    const loc = getLocation(h1!);
    expect(loc).toBeDefined();
    expect(loc!.line).toBeGreaterThan(0);
    expect(loc!.column).toBeGreaterThan(0);
  });
});

describe("walkElements", () => {
  it("yields all elements in depth-first order", () => {
    const doc = parseHtml("<div><p><span>Hi</span></p></div>");
    const tags = [...walkElements(doc)].map((el) => el.tagName);
    expect(tags).toContain("html");
    expect(tags).toContain("div");
    expect(tags).toContain("p");
    expect(tags).toContain("span");
    // div comes before p which comes before span (depth-first)
    expect(tags.indexOf("div")).toBeLessThan(tags.indexOf("p"));
    expect(tags.indexOf("p")).toBeLessThan(tags.indexOf("span"));
  });
});
