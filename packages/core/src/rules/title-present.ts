/**
 * title-present — checks that a <title> element exists and its text content
 * is between 10 and 60 characters.
 *
 * Why 10–60?
 * Google typically truncates titles at ~60 chars in SERPs. Titles shorter
 * than 10 chars rarely describe a page meaningfully and Google may rewrite
 * them. These thresholds match industry consensus (Moz, Ahrefs, etc.).
 *
 * @see https://developers.google.com/search/docs/appearance/title-link
 */

import type { Document } from "parse5/dist/tree-adapters/default.js";
import type { Rule, RuleContext, Finding } from "../types.js";
import { querySelector, getTextContent, getLocation } from "../parser.js";

const MIN_LENGTH = 10;
const MAX_LENGTH = 60;

export const titlePresent: Rule = {
  meta: {
    id: "title-present",
    severity: "error",
    category: "meta",
    description:
      "Page must have a <title> element with text between 10 and 60 characters.",
    docsUrl:
      "https://developers.google.com/search/docs/appearance/title-link",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const title = querySelector(doc, "title");

    if (!title) {
      findings.push({
        ruleId: "title-present",
        severity: titlePresent.meta.severity,
        category: titlePresent.meta.category,
        message: "Missing <title> element.",
        filePath: ctx.filePath,
      });
      return findings;
    }

    const text = getTextContent(title).trim();
    const loc = getLocation(title);

    if (text.length === 0) {
      findings.push({
        ruleId: "title-present",
        severity: titlePresent.meta.severity,
        category: titlePresent.meta.category,
        message: "The <title> element is empty.",
        filePath: ctx.filePath,
        ...loc,
      });
    } else if (text.length < MIN_LENGTH) {
      findings.push({
        ruleId: "title-present",
        severity: titlePresent.meta.severity,
        category: titlePresent.meta.category,
        message: `Title is too short (${text.length} chars). Minimum recommended is ${MIN_LENGTH}.`,
        filePath: ctx.filePath,
        ...loc,
      });
    } else if (text.length > MAX_LENGTH) {
      findings.push({
        ruleId: "title-present",
        severity: "warning",
        category: titlePresent.meta.category,
        message: `Title is too long (${text.length} chars). Maximum recommended is ${MAX_LENGTH}. Google may truncate it.`,
        filePath: ctx.filePath,
        ...loc,
      });
    }

    return findings;
  },
};
