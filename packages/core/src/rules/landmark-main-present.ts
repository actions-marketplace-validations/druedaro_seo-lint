import type { Rule, RuleContext, Finding } from "../types.js";
import {
  walkElements,
  getAttribute,
  hasAttribute,
  getLocation,
  type Document,
  type Element,
} from "../parser.js";

function getMainLandmarks(doc: Document): Element[] {
  const landmarks: Element[] = [];
  for (const el of walkElements(doc)) {
    if (el.tagName === "main" && !hasAttribute(el, "hidden")) {
      landmarks.push(el);
    } else if (
      el.tagName !== "main" &&
      getAttribute(el, "role")?.trim().toLowerCase() === "main" &&
      !hasAttribute(el, "hidden")
    ) {
      landmarks.push(el);
    }
  }
  return landmarks;
}

export const landmarkMainPresent: Rule = {
  meta: {
    id: "landmark-main-present",
    severity: "warning",
    category: "structure",
    description:
      'Document should include exactly one visible <main> landmark (or element with role="main") for accessibility and content extraction.',
    docsUrl:
      "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html",
  },

  check(doc: Document, ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const landmarks = getMainLandmarks(doc);

    if (landmarks.length === 0) {
      findings.push({
        ruleId: "landmark-main-present",
        severity: landmarkMainPresent.meta.severity,
        category: landmarkMainPresent.meta.category,
        message:
          'Document is missing a <main> landmark (or role="main"). Add a <main> element to wrap primary content.',
        filePath: ctx.filePath,
      });
      return findings;
    }

    if (landmarks.length > 1) {
      for (let i = 1; i < landmarks.length; i++) {
        const extra = landmarks[i];
        if (!extra) continue;
        const loc = getLocation(extra);
        findings.push({
          ruleId: "landmark-main-present",
          severity: landmarkMainPresent.meta.severity,
          category: landmarkMainPresent.meta.category,
          message:
            "Multiple visible <main> landmarks detected. A document must have at most one visible main landmark.",
          filePath: ctx.filePath,
          ...loc,
        });
      }
    }

    return findings;
  },
};

