#!/usr/bin/env node
import { parseArgs } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { loadConfig } from "./config.js";
import { scanAndLint } from "./scanner.js";
import {
  formatTextReport,
  formatJsonReport,
  formatGithubReport,
} from "./reporters/index.js";

function getVersion(): string {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(__dirname, "../package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return pkg.version ?? "0.1.0";
    }
  } catch {}
  return "0.1.0";
}

function printHelp(): void {
  console.log(`
seo-lint — Technical SEO and GEO linter for static site builds

Usage:
  seo-lint [directory] [options]

Arguments:
  directory              Target directory to audit (default: "dist")

Options:
  -c, --config <path>    Path to custom configuration file
  -i, --ignore <pattern> Comma-separated glob patterns to ignore (e.g. "404.html,assets/*")
  -r, --reporter <type>  Output reporter: "text", "json", "github" (default: "text")
  --max-warnings <num>   Exit with code 1 if warning count exceeds this number
  -v, --version          Show version number
  -h, --help             Show this help message

Examples:
  seo-lint dist/
  seo-lint build/ --reporter github
  seo-lint out/ --config ./seo-lint.config.json --max-warnings 0
`);
}

async function run(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      config: { type: "string", short: "c" },
      ignore: { type: "string", short: "i" },
      reporter: { type: "string", short: "r", default: "text" },
      "max-warnings": { type: "string" },
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.version) {
    console.log(getVersion());
    process.exit(0);
  }

  const cwd = process.cwd();
  const config = await loadConfig(cwd, values.config);

  const targetDir = positionals[0] ?? config.dist ?? "dist";
  const cliIgnores = values.ignore
    ? values.ignore.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const ignorePatterns = [...(config.ignore ?? []), ...cliIgnores];

  const result = scanAndLint({
    distDir: targetDir,
    config,
    ignore: ignorePatterns,
  });

  const reporter = values.reporter ?? "text";
  let formatted = "";

  switch (reporter) {
    case "json":
      formatted = formatJsonReport(result);
      break;
    case "github":
      formatted = formatGithubReport(result);
      break;
    case "text":
    default:
      formatted = formatTextReport(result);
      break;
  }

  process.stdout.write(formatted);

  const errorCount = result.findings.filter((f) => f.severity === "error").length;
  const warningCount = result.findings.filter((f) => f.severity === "warning").length;

  const maxWarnings =
    values["max-warnings"] !== undefined
      ? parseInt(values["max-warnings"], 10)
      : config.maxWarnings;

  const exceedsMaxWarnings =
    maxWarnings !== undefined && !isNaN(maxWarnings) && warningCount > maxWarnings;

  if (errorCount > 0 || exceedsMaxWarnings) {
    process.exit(1);
  }

  process.exit(0);
}

run().catch((err: any) => {
  console.error(`Error: ${err?.message ?? err}`);
  process.exit(1);
});
