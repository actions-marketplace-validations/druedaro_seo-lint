# Design Decisions

A record of relevant technical decisions made during development. It's not enough to know what was chosen — the why and what was discarded matter just as much.

| # | Decision | Alternatives considered | Why this option | Phase |
|---|---|---|---|---|
| 1 | Monorepo with npm workspaces | flat single repo, pnpm workspaces, turborepo | Native npm workspaces with no extra dependencies; sufficient for 3 packages. Turborepo adds unnecessary complexity at this scale. | 0 |
| 2 | `parse5` for HTML parsing | cheerio, jsdom, linkedom | parse5 is the parser used by the WHATWG standard; more faithful to real-world malformed HTML than cheerio (which wraps htmlparser2). jsdom is too heavy for a linter that does not need a full DOM. | 0 |
| 3 | Vitest for testing | Jest, node:test | Vitest shares config with Vite tooling, has native ESM and TypeScript support without extra setup. Consistent with other portfolio projects (Trainlog, SEO Compass). | 0 |
| 4 | Rules as pure functions `(doc, ctx) => Finding[]` | class inheritance, visitor pattern over AST | Pure functions are simpler to test in isolation and easier for contributors to understand. The visitor pattern adds unnecessary abstraction when each rule needs free access to the DOM. | 0 |
| 5 | Zod for config validation | ajv + JSON Schema, joi, manual | Zod has native TypeScript type inference — the config is typed without duplicating the schema. Lighter than ajv for this use case. | 0 |
