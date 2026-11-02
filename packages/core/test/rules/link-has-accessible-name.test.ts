import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { linkHasAccessibleName } from "../../src/rules/link-has-accessible-name.js";
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
  return linkHasAccessibleName.check(doc, makeCtx(html));
}

describe("link-has-accessible-name", () => {
  it("passes when link has direct text content", () => {
    const html = '<a href="/about">About Us</a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link has nested text content", () => {
    const html = '<a href="/blog"><span>Read our <strong>latest</strong> article</span></a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link has non-empty aria-label", () => {
    const html = '<a href="/profile" aria-label="User Profile"><svg></svg></a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link has non-empty aria-labelledby", () => {
    const html = '<a href="/cart" aria-labelledby="cart-label"><svg></svg></a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link has non-empty title attribute", () => {
    const html = '<a href="/search" title="Search site"><svg></svg></a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link contains an image with alt text", () => {
    const html = '<a href="/"><img src="/logo.png" alt="Company Logo"></a>';
    expect(run(html)).toEqual([]);
  });

  it("passes when link contains an svg with aria-label or title", () => {
    const htmlWithAria = '<a href="/twitter"><svg aria-label="Twitter Profile"><path></path></svg></a>';
    const htmlWithTitle = '<a href="/github"><svg><title>GitHub</title><path></path></svg></a>';
    expect(run(htmlWithAria)).toEqual([]);
    expect(run(htmlWithTitle)).toEqual([]);
  });

  it("ignores links without href attribute", () => {
    const html = '<a name="section-1"></a><a id="top"></a>';
    expect(run(html)).toEqual([]);
  });

  it("reports warning when link has href but no text and no accessible name", () => {
    const html = '<a href="/details"></a>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.message).toContain('Link does not have an accessible name (href: "/details")');
    expect(findings[0]?.line).toBeDefined();
  });

  it("reports warning when link contains only whitespace", () => {
    const html = '<a href="/empty">   \n  \t </a>';
    const findings = run(html);
    expect(findings).toHaveLength(1);
  });

  it("reports warning when inner image has empty or missing alt attribute", () => {
    const htmlEmptyAlt = '<a href="/icon"><img src="/icon.svg" alt=""></a>';
    const htmlNoAlt = '<a href="/icon"><img src="/icon.svg"></a>';
    expect(run(htmlEmptyAlt)).toHaveLength(1);
    expect(run(htmlNoAlt)).toHaveLength(1);
  });
});
