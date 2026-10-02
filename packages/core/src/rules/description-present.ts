/**
 * description-present — checks that a <meta name="description"> element
 * exists and its content is between 50 and 160 characters.
 *
 * Why 50–160?
 * Google truncates snippets around 155–160 chars. Descriptions under 50
 * chars don't give Google enough to show a useful snippet, increasing the
 * chance it generates its own (which may not match the page intent).
 *
 * @see https://developers.google.com/search/docs/appearance/snippet
 */

import type { Document } from "parse5/dist/tree-adapters/default.js";
import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelectorAll, getAttribute, getLocation } from "../parser.js";

const MIN_LENGTH = 50;
const MAX_LENGTH = 160;

export const descriptionPresent: Rule = {
  meta: {
    id: "description-present",
    severity: "warning",
    category: "meta",
    description:
      'Page should have a <meta name="description"> with content between 50 and 160 characters.',
    docsUrl:
      "https://developers.google.com/search/docs/appearance/snippet",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const metas = querySelectorAll(doc, "meta");
    const descMeta = metas.find(
      (el) => getAttribute(el, "name")?.toLowerCase() === "description",
    );

    if (!descMeta) {
      findings.push({
        ruleId: "description-present",
        severity: descriptionPresent.meta.severity,
        category: descriptionPresent.meta.category,
        message: 'Missing <meta name="description"> element.',
        filePath: ctx.filePath,
      });
      return findings;
    }

    const content = getAttribute(descMeta, "content") ?? "";
    const trimmed = content.trim();
    const loc = getLocation(descMeta);

    if (trimmed.length === 0) {
      findings.push({
        ruleId: "description-present",
        severity: descriptionPresent.meta.severity,
        category: descriptionPresent.meta.category,
        message: "Meta description is empty.",
        filePath: ctx.filePath,
        ...loc,
      });
    } else if (trimmed.length < MIN_LENGTH) {
      findings.push({
        ruleId: "description-present",
        severity: descriptionPresent.meta.severity,
        category: descriptionPresent.meta.category,
        message: `Meta description is too short (${trimmed.length} chars). Minimum recommended is ${MIN_LENGTH}.`,
        filePath: ctx.filePath,
        ...loc,
      });
    } else if (trimmed.length > MAX_LENGTH) {
      findings.push({
        ruleId: "description-present",
        severity: descriptionPresent.meta.severity,
        category: descriptionPresent.meta.category,
        message: `Meta description is too long (${trimmed.length} chars). Maximum recommended is ${MAX_LENGTH}. Google may truncate it.`,
        filePath: ctx.filePath,
        ...loc,
      });
    }

    return findings;
  },
};
