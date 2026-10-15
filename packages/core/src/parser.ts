import * as parse5 from "parse5";
import type { DefaultTreeAdapterTypes, Token } from "parse5";

export type Document = DefaultTreeAdapterTypes.Document;
export type Element = DefaultTreeAdapterTypes.Element;
export type ChildNode = DefaultTreeAdapterTypes.ChildNode;
export type TextNode = DefaultTreeAdapterTypes.TextNode;
export type ParentNode = DefaultTreeAdapterTypes.ParentNode;
export type CommentNode = DefaultTreeAdapterTypes.CommentNode;
export type Node = DefaultTreeAdapterTypes.Node;
export type Attribute = Token.Attribute;

export function parseHtml(html: string): Document {
  return parse5.parse(html, { sourceCodeLocationInfo: true });
}

export function* walkElements(node: ParentNode): Generator<Element> {
  for (const child of node.childNodes ?? []) {
    if (isElement(child)) {
      yield child;
      yield* walkElements(child);
    }
  }
}

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

export function getAttribute(el: Element, name: string): string | undefined {
  const attr = el.attrs.find(
    (a: Attribute) => a.name.toLowerCase() === name.toLowerCase(),
  );
  return attr?.value;
}

export function hasAttribute(el: Element, name: string): boolean {
  return el.attrs.some(
    (a: Attribute) => a.name.toLowerCase() === name.toLowerCase(),
  );
}

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

export function isElement(node: ChildNode): node is Element {
  return "tagName" in node;
}

export function isTextNode(node: ChildNode): node is TextNode {
  return node.nodeName === "#text";
}

export function getLocation(
  el: Element,
): { line: number; column: number } | undefined {
  const loc = el.sourceCodeLocation;
  if (!loc) return undefined;
  return { line: loc.startLine, column: loc.startCol };
}
