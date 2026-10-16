import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { jsonldValidSyntax } from "../../src/rules/jsonld-valid-syntax.js";
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
  return jsonldValidSyntax.check(doc, makeCtx(html));
}

describe("jsonld-valid-syntax", () => {
  it("passes with valid JSON-LD object", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "My Site",
    "url": "https://example.com"
  }
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes with valid JSON-LD array of objects", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  [
    { "@context": "https://schema.org", "@type": "WebSite", "name": "Site" },
    { "@context": "https://schema.org", "@type": "Organization", "name": "Org" }
  ]
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("passes when there are no JSON-LD scripts on the page", () => {
    const html = `<html>
<head>
  <script src="/bundle.js"></script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("ignores non-jsonld script tags even if they contain regular JavaScript", () => {
    const html = `<html>
<head>
  <script type="text/javascript">
    const x = { unquotedKey: 1, trailingComma: 2, };
  </script>
</head>
<body></body>
</html>`;
    expect(run(html)).toEqual([]);
  });

  it("reports error when JSON-LD syntax is malformed", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite"
    "name": "Missing comma"
  }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/Malformed JSON-LD syntax/);
  });

  it("reports error when JSON-LD is empty or whitespace", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/is empty/);
  });

  it("reports error when JSON-LD evaluates to a primitive value", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">"plain string"</script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
    expect(findings[0]?.message).toMatch(/must be a JSON object or array/);
  });

  it("reports multiple errors if multiple JSON-LD blocks are broken", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">{ invalid json 1 }</script>
  <script type="application/ld+json">{ "valid": true }</script>
  <script type="application/ld+json">{ invalid json 2 }</script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings).toHaveLength(2);
  });

  it("includes line and column source location", () => {
    const html = `<html>
<head>
  <script type="application/ld+json">
    { invalid }
  </script>
</head>
<body></body>
</html>`;
    const findings = run(html);
    expect(findings[0]?.line).toBe(3);
    expect(findings[0]?.column).toBeDefined();
  });
});
