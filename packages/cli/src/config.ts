import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import type { SeoLintConfig } from "@seo-lint/core";

export const ConfigSchema = z.object({
  dist: z.string().optional().default("dist"),
  ignore: z.array(z.string()).optional().default([]),
  maxWarnings: z.number().int().nonnegative().optional(),
  rules: z
    .record(
      z.union([
        z.enum(["off", "warning", "error"]),
        z.tuple([z.enum(["warning", "error"])]),
        z.tuple([z.enum(["warning", "error"]), z.record(z.unknown())]),
      ])
    )
    .optional(),
});

export type ValidatedConfig = z.infer<typeof ConfigSchema>;

export async function loadConfig(
  cwd: string = process.cwd(),
  customPath?: string
): Promise<ValidatedConfig> {
  const candidateFiles = customPath
    ? [customPath]
    : [
        "seo-lint.config.json",
        ".seolintrc.json",
        ".seolintrc",
        "seo-lint.config.js",
        "seo-lint.config.mjs",
      ];

  for (const candidate of candidateFiles) {
    const fullPath = path.isAbsolute(candidate) ? candidate : path.join(cwd, candidate);
    if (!fs.existsSync(fullPath)) {
      if (customPath) {
        throw new Error(`Configuration file not found: "${customPath}"`);
      }
      continue;
    }

    try {
      if (fullPath.endsWith(".js") || fullPath.endsWith(".mjs")) {
        const mod = await import(`file://${fullPath}`);
        const raw = mod.default ?? mod;
        return ConfigSchema.parse(raw);
      }

      const text = fs.readFileSync(fullPath, "utf-8");
      const raw = JSON.parse(text);
      return ConfigSchema.parse(raw);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n");
        throw new Error(`Invalid configuration in ${candidate}:\n${issues}`);
      }
      throw err;
    }
  }

  return ConfigSchema.parse({});
}
