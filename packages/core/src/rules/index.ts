import type { Rule } from "../types.js";
import { titlePresent } from "./title-present.js";
import { descriptionPresent } from "./description-present.js";
import { singleH1 } from "./single-h1.js";
import { canonicalPresent } from "./canonical-present.js";
import { ogTagsComplete } from "./og-tags-complete.js";
import { headingOrder } from "./heading-order.js";
import { imgAltPresent } from "./img-alt-present.js";
import { langAttribute } from "./lang-attribute.js";
import { hreflangValidCodes } from "./hreflang-valid-codes.js";
import { hreflangSelfReference } from "./hreflang-self-reference.js";
import { hreflangReciprocal } from "./hreflang-reciprocal.js";

export const builtinRules: Rule[] = [
  titlePresent,
  descriptionPresent,
  singleH1,
  canonicalPresent,
  ogTagsComplete,
  headingOrder,
  imgAltPresent,
  langAttribute,
  hreflangValidCodes,
  hreflangSelfReference,
  hreflangReciprocal,
];
