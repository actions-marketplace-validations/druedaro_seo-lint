/**
 * Rule registry — single source of truth for all built-in rules.
 *
 * Import each rule module and re-export them as a flat array. The engine
 * iterates over this array; the order doesn't matter because each rule is
 * independent.
 */

import type { Rule } from "../types.js";
import { titlePresent } from "./title-present.js";

/** All built-in rules, in no particular order. */
export const builtinRules: Rule[] = [titlePresent];
