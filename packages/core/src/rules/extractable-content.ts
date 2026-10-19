import type { Rule, RuleContext, Finding, RuleMeta } from "../types.js";
import {
  querySelector,
  querySelectorAll,
  getAttribute,
  isElement,
  isTextNode,
  type ParentNode,
  type Document,
} from "../parser.js";

const meta: RuleMeta = {
  id: "extractable-content",
  severity: "warning",
  category: "geo",
  description: "Main content must be extractable from static HTML without depending exclusively on client-side JS",
  docsUrl: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics",
};

const SPA_CONTAINER_IDS = new Set(["root", "app", "__next"]);

function getVisibleText(node: ParentNode): string {
  let text = "";
  for (const child of node.childNodes ?? []) {
    if (isTextNode(child)) {
      text += child.value;
    } else if (isElement(child)) {
      const tag = child.tagName.toLowerCase();
      if (
        tag === "script" ||
        tag === "style" ||
        tag === "noscript" ||
        tag === "template" ||
        tag === "svg"
      ) {
        continue;
      }
      text += " " + getVisibleText(child);
    }
  }
  return text.trim();
}

function check(doc: Document, ctx: RuleContext): Finding[] {
  const findings: Finding[] = [];
  const body = querySelector(doc, "body");

  if (!body) {
    findings.push({
      ruleId: meta.id,
      severity: meta.severity,
      category: meta.category,
      message: "Document is missing a <body> tag with extractable content.",
      filePath: ctx.filePath,
    });
    return findings;
  }

  const visibleText = getVisibleText(body);

  if (!visibleText) {
    findings.push({
      ruleId: meta.id,
      severity: meta.severity,
      category: meta.category,
      message: "Main page content is empty or relies entirely on client-side JavaScript rendering.",
      filePath: ctx.filePath,
    });
    return findings;
  }

  const divs = querySelectorAll(body, "div");
  const hasEmptySpaMount = divs.some((div) => {
    const id = getAttribute(div, "id")?.toLowerCase() ?? "";
    return SPA_CONTAINER_IDS.has(id) && !getVisibleText(div);
  });

  if (hasEmptySpaMount && visibleText.length < 30) {
    findings.push({
      ruleId: meta.id,
      severity: meta.severity,
      category: meta.category,
      message: "Empty client-side mount point detected without pre-rendered content.",
      filePath: ctx.filePath,
    });
  }

  return findings;
}

export const extractableContent: Rule = {
  meta,
  check,
};
