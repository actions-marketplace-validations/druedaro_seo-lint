import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { jsonldValidType } from "../../src/rules/jsonld-valid-type.js";
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
  return jsonldValidType.check(doc, makeCtx(html));
}

describe("jsonld-valid-type", () => {
  it("passes with valid standard Schema.org type", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Great Post"
  }
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes with full Schema.org URL prefix in @type", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "https://schema.org/BlogPosting",
    "headline": "Great Post"
  }
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes with multi-typed entity array", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["WebPage", "ItemPage"]
  }
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes with @graph structure containing valid entities", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "name": "Site" },
      { "@type": "Organization", "name": "Org" }
    ]
  }
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when there are no JSON-LD scripts", () => {
    const html = "<html><head></head><body></body></html>";
    expect(run(html)).toEqual([]);
  });

  it("ignores malformed JSON-LD (handled by syntax rule)", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">{ invalid json</script>
</head>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("reports error when top-level entity is missing @type", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "name": "Missing type"
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/missing a "@type"/);
  });

  it("reports error when an entity inside @graph is missing @type", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      { "name": "No type" }
    ]
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/missing a "@type"/);
  });

  it("reports error for unknown Schema.org type", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CustomUnregisteredType"
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/Unknown Schema\.org @type "CustomUnregisteredType"/);
  });

  it("reports error when @type is not a string or array of strings", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": 12345
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/must be a string or array of strings/);
  });

  it("includes line and column source location", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@type": "NonExistent"
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(3);
    expect(findings[0]?.column).toBeDefined();
  });
});
