import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ConfigSchema, loadConfig } from "../src/config.js";

describe("cli config", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-lint-config-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("validates empty config with defaults", () => {
    const parsed = ConfigSchema.parse({});
    expect(parsed.dist).toBe("dist");
    expect(parsed.ignore).toEqual([]);
    expect(parsed.rules).toBeUndefined();
  });

  it("validates custom rule configurations", () => {
    const parsed = ConfigSchema.parse({
      dist: "build",
      ignore: ["admin/*"],
      maxWarnings: 5,
      rules: {
        "title-present": "error",
        "description-present": "off",
        "single-h1": ["warning"],
        "lang-attribute": ["error", { custom: true }],
      },
    });

    expect(parsed.dist).toBe("build");
    expect(parsed.maxWarnings).toBe(5);
    expect(parsed.rules?.["title-present"]).toBe("error");
    expect(parsed.rules?.["single-h1"]).toEqual(["warning"]);
  });

  it("fails on invalid severity values", () => {
    expect(() => {
      ConfigSchema.parse({
        rules: {
          "title-present": "invalid-severity",
        },
      });
    }).toThrow();
  });

  it("loads config from json file", async () => {
    const configPath = path.join(tmpDir, "seo-lint.config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        dist: "out",
        rules: {
          "title-present": "off",
        },
      })
    );

    const loaded = await loadConfig(tmpDir);
    expect(loaded.dist).toBe("out");
    expect(loaded.rules?.["title-present"]).toBe("off");
  });

  it("throws descriptive error when config is malformed", async () => {
    const configPath = path.join(tmpDir, "seo-lint.config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        maxWarnings: "not-a-number",
      })
    );

    await expect(loadConfig(tmpDir)).rejects.toThrow(/Invalid configuration/);
  });
});
