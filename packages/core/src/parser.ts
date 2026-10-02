/**
 * parser.ts — thin wrapper over parse5 with cheerio-style helpers.
 *
 * Why parse5 and not cheerio?
 * parse5 implements the WHATWG HTML parsing algorithm, so it handles
 * malformed HTML the same way browsers do. Cheerio wraps htmlparser2 which
 * takes shortcuts that can produce different trees for edge-case markup.
 * Since seo-lint analyses real build output (which can be messy), fidelity
 * to the browser matters more than API convenience.
 *
 * The helpers below provide the convenience we lose by not using cheerio,
 * without pulling in an extra dependency.
 */

import * as parse5 from "parse5";
import type {
  Document,
  Element,
  ChildNode,
  TextNode,
  ParentNode,
} from "parse5/dist/tree-adapters/default.js";

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/** Parse an HTML string into a parse5 Document. */
export function parseHtml(html: string): Document {
  return parse5.parse(html, { sourceCodeLocationInfo: true });
}

// ---------------------------------------------------------------------------
// Traversal helpers
// ---------------------------------------------------------------------------

/** Depth-first walk of the tree, yielding every Element node. */
export function* walkElements(node: ParentNode): Generator<Element> {
  for (const child of node.childNodes ?? []) {
    if (isElement(child)) {
      yield child;
      yield* walkElements(child);
    }
  }
}

/** Find all elements matching a tag name (case-insensitive). */
export function querySelectorAll(
  root: ParentNode,
  tagName: string,
): Element[] {
  const lower = tagName.toLowerCase();
  const results: Element[] = [];
  for (const el of walkElements(root)) {
    if (el.tagName === lower) {
      results.push(el);
    }
  }
  return results;
}

/** Find the first element matching a tag name, or `undefined`. */
export function querySelector(
  root: ParentNode,
  tagName: string,
): Element | undefined {
  const lower = tagName.toLowerCase();
  for (const el of walkElements(root)) {
    if (el.tagName === lower) {
      return el;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Attribute helpers
// ---------------------------------------------------------------------------

/** Get an attribute value by name, or `undefined` if absent. */
export function getAttribute(el: Element, name: string): string | undefined {
  const attr = el.attrs.find(
    (a) => a.name.toLowerCase() === name.toLowerCase(),
  );
  return attr?.value;
}

/** Check whether an element has a given attribute (even if empty). */
export function hasAttribute(el: Element, name: string): boolean {
  return el.attrs.some(
    (a) => a.name.toLowerCase() === name.toLowerCase(),
  );
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Get the concatenated text content of an element and its descendants. */
export function getTextContent(node: ParentNode): string {
  let text = "";
  for (const child of node.childNodes ?? []) {
    if (isTextNode(child)) {
      text += child.value;
    } else if (isElement(child)) {
      text += getTextContent(child);
    }
  }
  return text;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isElement(node: ChildNode): node is Element {
  return "tagName" in node;
}

export function isTextNode(node: ChildNode): node is TextNode {
  return node.nodeName === "#text";
}

// ---------------------------------------------------------------------------
// Location helpers
// ---------------------------------------------------------------------------

/** Extract 1-based line and column from a parse5 element, if available. */
export function getLocation(
  el: Element,
): { line: number; column: number } | undefined {
  const loc = el.sourceCodeLocation;
  if (!loc) return undefined;
  return { line: loc.startLine, column: loc.startCol };
}
