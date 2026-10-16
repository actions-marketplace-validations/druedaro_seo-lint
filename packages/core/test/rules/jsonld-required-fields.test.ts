import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { jsonldRequiredFields } from "../../src/rules/jsonld-required-fields.js";
import type { RuleContext } from "../../src/types.js";

const ctx: RuleContext = { filePath: "test.html" };

function html(jsonld: unknown): string {
  return `<html><head><script type="application/ld+json">${JSON.stringify(jsonld)}</script></head><body></body></html>`;
}

describe("jsonld-required-fields", () => {
  it("passes when Article has all required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Test",
        author: { "@type": "Person", name: "Alice" },
        datePublished: "2024-01-01",
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when Article is missing headline", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "Article",
        author: { "@type": "Person", name: "Alice" },
        datePublished: "2024-01-01",
      })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/Article.*headline/);
  });

  it("fails when Article is missing multiple required fields", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Article" })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(3);
    const messages = findings.map((f) => f.message);
    expect(messages.some((m) => m.includes("headline"))).toBe(true);
    expect(messages.some((m) => m.includes("author"))).toBe(true);
    expect(messages.some((m) => m.includes("datePublished"))).toBe(true);
  });

  it("passes when Product has name", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Product", name: "Widget" })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when Product is missing name", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Product" })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/Product.*name/);
  });

  it("passes when BreadcrumbList has itemListElement", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [],
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when BreadcrumbList is missing itemListElement", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "BreadcrumbList" })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/BreadcrumbList.*itemListElement/);
  });

  it("passes when Recipe has all required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: "Pasta",
        recipeIngredient: ["noodles"],
        recipeInstructions: [{ "@type": "HowToStep", text: "Boil" }],
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when Recipe is missing recipeIngredient and recipeInstructions", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Recipe", name: "Pasta" })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(2);
    const messages = findings.map((f) => f.message);
    expect(messages.some((m) => m.includes("recipeIngredient"))).toBe(true);
    expect(messages.some((m) => m.includes("recipeInstructions"))).toBe(true);
  });

  it("passes when Event has all required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "Event",
        name: "Concert",
        startDate: "2024-06-01",
        location: { "@type": "Place", name: "Venue" },
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when Event is missing location", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "Event",
        name: "Concert",
        startDate: "2024-06-01",
      })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/Event.*location/);
  });

  it("passes for type with no required fields defined (e.g. Thing)", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Thing" })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("skips non-JSON-LD scripts", () => {
    const doc = parseHtml(
      `<html><head><script type="text/javascript">var x = 1;</script></head><body></body></html>`
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("skips empty script blocks", () => {
    const doc = parseHtml(
      `<html><head><script type="application/ld+json"></script></head><body></body></html>`
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("skips unparseable JSON", () => {
    const doc = parseHtml(
      `<html><head><script type="application/ld+json">{invalid json}</script></head><body></body></html>`
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("handles schema.org URL prefix in @type", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "https://schema.org/Article",
        headline: "Test",
        author: "Alice",
        datePublished: "2024-01-01",
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("handles @graph with multiple entities", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: "H",
            author: "A",
            datePublished: "2024-01-01",
          },
          {
            "@type": "Product",
            name: "Widget",
          },
        ],
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when @graph entity is missing required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Article" },
          { "@type": "Product" },
        ],
      })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    const messages = findings.map((f) => f.message);
    expect(messages.some((m) => m.includes("Article"))).toBe(true);
    expect(messages.some((m) => m.includes("Product"))).toBe(true);
  });

  it("handles multiple JSON-LD scripts on the same page", () => {
    const doc = parseHtml(
      `<html><head>
        <script type="application/ld+json">${JSON.stringify({ "@type": "Product" })}</script>
        <script type="application/ld+json">${JSON.stringify({ "@type": "Article" })}</script>
      </head><body></body></html>`
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    const messages = findings.map((f) => f.message);
    expect(messages.some((m) => m.includes("Product"))).toBe(true);
    expect(messages.some((m) => m.includes("Article"))).toBe(true);
  });

  it("passes when AggregateRating has ratingValue and ratingCount", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "AggregateRating",
        ratingValue: 4.5,
        ratingCount: 120,
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when AggregateRating is missing ratingCount", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "AggregateRating",
        ratingValue: 4.5,
      })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/AggregateRating.*ratingCount/);
  });

  it("passes when JobPosting has all required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: "Engineer",
        description: "Code stuff",
        datePosted: "2024-01-01",
        hiringOrganization: { "@type": "Organization", name: "Corp" },
        jobLocation: { "@type": "Place", name: "Remote" },
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("fails when JobPosting is missing multiple required fields", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: "Engineer",
      })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings.length).toBeGreaterThanOrEqual(3);
  });

  it("handles array @type and checks all matching types", () => {
    const doc = parseHtml(
      html({
        "@context": "https://schema.org",
        "@type": ["Article", "NewsArticle"],
        headline: "H",
        author: "A",
        datePublished: "2024-01-01",
      })
    );
    expect(jsonldRequiredFields.check(doc, ctx)).toHaveLength(0);
  });

  it("reports ruleId correctly", () => {
    const doc = parseHtml(
      html({ "@context": "https://schema.org", "@type": "Article" })
    );
    const findings = jsonldRequiredFields.check(doc, ctx);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.ruleId).toBe("jsonld-required-fields");
      expect(f.severity).toBe("error");
      expect(f.category).toBe("structured-data");
    }
  });
});
