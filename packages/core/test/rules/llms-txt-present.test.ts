import { describe, it, expect } from "vitest";
import { parseHtml } from "../../src/parser.js";
import { llmsTxtPresent } from "../../src/rules/llms-txt-present.js";
import type { RuleContext } from "../../src/types.js";

const dummyDoc = parseHtml("<html><head></head><body></body></html>");

function createCtx(options: {
  files?: Record<string, string>;
  allFiles?: string[];
  filePath?: string;
  html?: string;
}): RuleContext {
  const files = options.files ?? {};
  return {
    filePath: options.filePath ?? "index.html",
    html: options.html ?? "<html></html>",
    allFiles: options.allFiles ?? Object.keys(files),
    isMultiLang: false,
    getFileContent: (p: string) => files[p] ?? files[p.replace(/^\//, "")],
  };
}

describe("llms-txt-present", () => {
  it("passes when llms.txt exists with valid H1 header", () => {
    const ctx = createCtx({
      files: {
        "llms.txt": "# My Project\n\n> Summary description\n\n- [Docs](/docs)",
      },
    });
    const findings = llmsTxtPresent.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("warns when HTML links to llms.txt but the file does not exist", () => {
    const html = '<html><head><link rel="describedby" href="/llms.txt"></head><body></body></html>';
    const doc = parseHtml(html);
    const ctx = createCtx({
      html,
      files: {},
      allFiles: ["index.html"],
    });
    const findings = llmsTxtPresent.check(doc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/does not exist at site root/);
    expect(findings[0]?.severity).toBe("warning");
    expect(findings[0]?.category).toBe("geo");
  });

  it("warns when llms.txt is empty", () => {
    const ctx = createCtx({
      files: {
        "llms.txt": "   \n  ",
      },
    });
    const findings = llmsTxtPresent.check(dummyDoc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/is empty/);
  });

  it("warns when llms.txt lacks an H1 title", () => {
    const ctx = createCtx({
      files: {
        "llms.txt": "Just some plain text without header",
      },
    });
    const findings = llmsTxtPresent.check(dummyDoc, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toMatch(/missing a top-level H1/);
  });

  it("ignores when llms.txt is not referenced or present", () => {
    const ctx = createCtx({
      files: {},
      allFiles: ["index.html"],
    });
    const findings = llmsTxtPresent.check(dummyDoc, ctx);
    expect(findings).toHaveLength(0);
  });

  it("applies only to the first file to prevent duplicate findings across pages", () => {
    const ctxFirst = createCtx({
      filePath: "index.html",
      allFiles: ["index.html", "about.html"],
    });
    const ctxSecond = createCtx({
      filePath: "about.html",
      allFiles: ["index.html", "about.html"],
    });

    expect(llmsTxtPresent.appliesTo?.(ctxFirst)).toBe(true);
    expect(llmsTxtPresent.appliesTo?.(ctxSecond)).toBe(false);
  });
});
