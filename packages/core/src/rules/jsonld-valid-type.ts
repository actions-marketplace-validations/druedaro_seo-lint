import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, getAttribute, getTextContent, getLocation, type Document } from "../parser.js";

import { SCHEMA_ORG_TYPES } from "./data/schema-org-types.js";

function normalizeTypeName(rawType: string): string {
  return rawType
    .trim()
    .replace(/^https?:\/\/schema\.org\//, "");
}

function inspectEntities(val: unknown, callback: (obj: Record<string, unknown>, isTopLevel: boolean) => void, isTopLevel = true) {
  if (!val || typeof val !== "object") return;

  if (Array.isArray(val)) {
    for (const item of val) {
      inspectEntities(item, callback, true);
    }
    return;
  }

  const obj = val as Record<string, unknown>;

  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      inspectEntities(item, callback, true);
    }
    return;
  }

  callback(obj, isTopLevel);

  for (const [key, v] of Object.entries(obj)) {
    if (key === "@graph" || key === "@context") continue;
    if (typeof v === "object" && v !== null) {
      inspectEntities(v, callback, false);
    }
  }
}

export const jsonldValidType: Rule = {
  meta: {
    id: "jsonld-valid-type",
    severity: "error",
    category: "structured-data",
    description: "JSON-LD entities must have a valid @type matching the Schema.org vocabulary.",
    docsUrl: "https://schema.org/docs/full.html",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const scripts = querySelectorAll(doc, "script");

    const jsonLdScripts = scripts.filter((el) => {
      const type = getAttribute(el, "type");
      return type?.trim().toLowerCase() === "application/ld+json";
    });

    for (const script of jsonLdScripts) {
      const loc = getLocation(script);
      const text = getTextContent(script).trim();
      if (text.length === 0) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }

      inspectEntities(parsed, (obj, isTopLevel) => {
        const rawType = obj["@type"];

        if (rawType === undefined) {
          if (isTopLevel) {
            findings.push({
              ruleId: "jsonld-valid-type",
              severity: jsonldValidType.meta.severity,
              category: jsonldValidType.meta.category,
              message: 'Top-level JSON-LD entity is missing a "@type" property.',
              filePath: ctx.filePath,
              ...loc,
            });
          }
          return;
        }

        const typesToCheck: string[] = [];

        if (typeof rawType === "string") {
          typesToCheck.push(rawType);
        } else if (Array.isArray(rawType)) {
          for (const t of rawType) {
            if (typeof t === "string") {
              typesToCheck.push(t);
            } else {
              findings.push({
                ruleId: "jsonld-valid-type",
                severity: jsonldValidType.meta.severity,
                category: jsonldValidType.meta.category,
                message: 'Invalid "@type" element: each item in @type array must be a string.',
                filePath: ctx.filePath,
                ...loc,
              });
            }
          }
        } else {
          findings.push({
            ruleId: "jsonld-valid-type",
            severity: jsonldValidType.meta.severity,
            category: jsonldValidType.meta.category,
            message: 'Invalid "@type" property: must be a string or array of strings.',
            filePath: ctx.filePath,
            ...loc,
          });
          return;
        }

        for (const type of typesToCheck) {
          const normalized = normalizeTypeName(type);
          if (!SCHEMA_ORG_TYPES.has(normalized)) {
            findings.push({
              ruleId: "jsonld-valid-type",
              severity: jsonldValidType.meta.severity,
              category: jsonldValidType.meta.category,
              message: `Unknown Schema.org @type "${type}". Check spelling or Schema.org vocabulary.`,
              filePath: ctx.filePath,
              ...loc,
            });
          }
        }
      });
    }

    return findings;
  },
};
