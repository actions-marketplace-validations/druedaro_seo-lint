import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { scanAndLint } from "../src/scanner.js";

describe("cli scanner", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-lint-scanner-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws when target directory does not exist", () => {
    expect(() => {
      scanAndLint({ distDir: path.join(tmpDir, "non-existent") });
    }).toThrow(/Target directory does not exist/);
  });

  it("scans html files in directory and respects ignore patterns", () => {
    const dist = path.join(tmpDir, "dist");
    const sub = path.join(dist, "nested");
    const ignoredDir = path.join(dist, "admin");
    fs.mkdirSync(dist, { recursive: true });
    fs.mkdirSync(sub, { recursive: true });
    fs.mkdirSync(ignoredDir, { recursive: true });

    fs.writeFileSync(
      path.join(dist, "index.html"),
      "<!DOCTYPE html><html lang='en'><head><title>Home Page Title Here</title><meta name='description' content='Valid length meta description for the home page.'><link rel='canonical' href='https://example.com/'><meta property='og:title' content='Home Page Title Here'><meta property='og:description' content='Valid length meta description for the home page.'><meta property='og:image' content='https://example.com/og.jpg'></head><body><h1>Heading</h1><p>Content goes here.</p></body></html>"
    );

    fs.writeFileSync(
      path.join(sub, "page.html"),
      "<!DOCTYPE html><html lang='en'><head><title>Sub Page Title Here</title><meta name='description' content='Valid length meta description for the sub page.'><link rel='canonical' href='https://example.com/nested/page'><meta property='og:title' content='Sub Page Title Here'><meta property='og:description' content='Valid length meta description for the sub page.'><meta property='og:image' content='https://example.com/og.jpg'></head><body><h1>Heading</h1><p>Content goes here.</p></body></html>"
    );

    fs.writeFileSync(
      path.join(ignoredDir, "secret.html"),
      "<html><head></head><body>No title</body></html>"
    );

    const result = scanAndLint({
      distDir: dist,
      ignore: ["admin/"],
    });

    expect(result.filesAnalysed).toBe(2);
    expect(result.hasErrors).toBe(false);
  });
});
