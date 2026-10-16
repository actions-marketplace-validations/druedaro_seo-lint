import type { Rule, RuleContext, Finding } from "../types.js";
import {
  querySelectorAll,
  getAttribute,
  getTextContent,
  getLocation,
  type Document,
} from "../parser.js";

type FieldSpec = readonly string[];

const REQUIRED_FIELDS: Readonly<Record<string, FieldSpec>> = {
  Article: ["headline", "author", "datePublished"],
  NewsArticle: ["headline", "author", "datePublished"],
  BlogPosting: ["headline", "author", "datePublished"],
  ScholarlyArticle: ["headline", "author", "datePublished"],
  TechArticle: ["headline", "author", "datePublished"],
  Product: ["name"],
  Offer: ["price", "priceCurrency"],
  AggregateOffer: ["lowPrice", "priceCurrency"],
  AggregateRating: ["ratingValue", "ratingCount"],
  Recipe: ["name", "recipeIngredient", "recipeInstructions"],
  Event: ["name", "startDate", "location"],
  BreadcrumbList: ["itemListElement"],
  ListItem: ["position", "name"],
  FAQPage: ["mainEntity"],
  Question: ["name", "acceptedAnswer"],
  Answer: ["text"],
  HowTo: ["name", "step"],
  Review: ["itemReviewed", "reviewRating", "author"],
  JobPosting: ["title", "description", "datePosted", "hiringOrganization", "jobLocation"],
  Course: ["name", "description"],
  VideoObject: ["name", "description", "thumbnailUrl", "uploadDate"],
  ImageObject: ["url"],
  Person: ["name"],
  Organization: ["name"],
  LocalBusiness: ["name", "address"],
  WebSite: ["name", "url"],
  WebPage: ["name"],
  SoftwareApplication: ["name", "operatingSystem", "applicationCategory"],
};

function normalizeType(raw: string): string {
  return raw.trim().replace(/^https?:\/\/schema\.org\//, "");
}

function extractTypes(rawType: unknown): string[] {
  if (typeof rawType === "string") return [normalizeType(rawType)];
  if (Array.isArray(rawType)) {
    return rawType.flatMap((t) =>
      typeof t === "string" ? [normalizeType(t)] : []
    );
  }
  return [];
}

function hasProp(obj: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, field) && obj[field] !== undefined && obj[field] !== null;
}

function collectEntities(
  val: unknown,
  out: Array<Record<string, unknown>>
): void {
  if (!val || typeof val !== "object") return;

  if (Array.isArray(val)) {
    for (const item of val) collectEntities(item, out);
    return;
  }

  const obj = val as Record<string, unknown>;

  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) collectEntities(item, out);
    return;
  }

  out.push(obj);

  for (const [key, v] of Object.entries(obj)) {
    if (key === "@graph" || key === "@context") continue;
    if (typeof v === "object" && v !== null) collectEntities(v, out);
  }
}

export const jsonldRequiredFields: Rule = {
  meta: {
    id: "jsonld-required-fields",
    severity: "error",
    category: "structured-data",
    description:
      "JSON-LD entities must include the required fields for their @type per Google Rich Results requirements.",
    docsUrl: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery",
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

      const entities: Array<Record<string, unknown>> = [];
      collectEntities(parsed, entities);

      for (const entity of entities) {
        const types = extractTypes(entity["@type"]);

        for (const typeName of types) {
          const required = REQUIRED_FIELDS[typeName];
          if (!required) continue;

          for (const field of required) {
            if (!hasProp(entity, field)) {
              findings.push({
                ruleId: "jsonld-required-fields",
                severity: jsonldRequiredFields.meta.severity,
                category: jsonldRequiredFields.meta.category,
                message: `JSON-LD entity of type "${typeName}" is missing required field "${field}".`,
                filePath: ctx.filePath,
                ...loc,
              });
            }
          }
        }
      }
    }

    return findings;
  },
};
