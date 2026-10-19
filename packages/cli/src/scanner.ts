import * as fs from "fs";
import * as path from "path";
import { lintFiles, type LintResult, type SeoLintConfig } from "@seo-lint/core";

export interface ScanOptions {
  distDir: string;
  config?: SeoLintConfig;
  ignore?: string[];
}

function shouldIgnore(relPath: string, ignorePatterns: string[]): boolean {
  for (const pattern of ignorePatterns) {
    if (pattern && relPath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function collectAllFiles(dir: string, baseDir: string = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAllFiles(full, baseDir));
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, full).replace(/\\/g, "/");
      results.push(rel);
    }
  }

  return results;
}

export function scanAndLint(options: ScanOptions): LintResult {
  const { distDir, config, ignore = [] } = options;
  const absDist = path.resolve(distDir);

  if (!fs.existsSync(absDist)) {
    throw new Error(`Target directory does not exist: "${distDir}" (resolved: ${absDist})`);
  }

  const allCollected = collectAllFiles(absDist);
  const allFiles = allCollected.filter((f) => !shouldIgnore(f, ignore));

  const htmlRelPaths = allFiles.filter((f) => f.endsWith(".html") || f.endsWith(".htm"));

  const htmlFiles: Array<{ filePath: string; html: string }> = [];
  let isMultiLang = false;

  for (const rel of htmlRelPaths) {
    const full = path.join(absDist, rel);
    const content = fs.readFileSync(full, "utf-8");
    htmlFiles.push({ filePath: rel, html: content });

    if (!isMultiLang && /hreflang/i.test(content)) {
      isMultiLang = true;
    }
  }

  return lintFiles(htmlFiles, {
    allFiles,
    isMultiLang,
    config,
  });
}
