import type { Rule } from "../types.js";
import { titlePresent } from "./title-present.js";
import { descriptionPresent } from "./description-present.js";
import { singleH1 } from "./single-h1.js";

export const builtinRules: Rule[] = [titlePresent, descriptionPresent, singleH1];
