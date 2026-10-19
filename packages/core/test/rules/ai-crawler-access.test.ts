import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { aiCrawlerAccess } from "../../src/rules/ai-crawler-access.js";
import type { RuleContext } from "../../src/types.js";

const dummyDoc = parseHtml("<html><head></head><body></body></html>");

function createCtx(options: {
  files?: Record<string, string>;
  allFiles?: string[];
  filePath?: string;
}): RuleContext {
  const files = options.files ?? {};
  return {
    filePath: options.filePath ?? "index.html",
    html: "<html></html>",
    allFiles: options.allFiles ?? Object.keys(files),
    isMultiLang: false,
    getFileContent: (p: string) => files[p] ?? files[p.replace(/^\//, "")],
  };
}

describe("ai-crawler-access", () => {
  it("passes when robots.txt does not block AI crawlers or root", () => {
    const ctx = createCtx({
      files: {
        "robots.txt": "User-agent: *\nDisallow: /private\nDisallow: /admin/",
      },
    });
    const findings = aiCrawlerAccess.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("warns when wildcard blocks root", () => {
    const ctx = createCtx({
      files: {
        "robots.txt": "User-agent: *\nDisallow: /",
      },
    });
    const findings = aiCrawlerAccess.check(dummyDoc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/blocks all crawlers/);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.category).toBe("geo");
  });

  it("warns when specific AI crawler is blocked at root", () => {
    const ctx = createCtx({
      files: {
        "robots.txt": "User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /",
      },
    });
    const findings = aiCrawlerAccess.check(dummyDoc, ctx);
    expect(findings).toHaveLength(2);
    expect(findings[0]?.message).toMatch(/gptbot/);
    expect(findings[1]?.message).toMatch(/claudebot/);
  });

  it("passes when robots.txt does not exist", () => {
    const ctx = createCtx({
      files: {},
      allFiles: ["index.html"],
    });
    const findings = aiCrawlerAccess.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("applies only to the first file", () => {
    const ctxFirst = createCtx({
      filePath: "index.html",
      allFiles: ["index.html", "about.html"],
    });
    const ctxSecond = createCtx({
      filePath: "about.html",
      allFiles: ["index.html", "about.html"],
    });

    expect(aiCrawlerAccess.appliesTo?.(ctxFirst)).toBe(true);
    expect(aiCrawlerAccess.appliesTo?.(ctxSecond)).toBe(false);
  });
});
