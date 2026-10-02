# Decisiones de diseño

Registro de decisiones técnicas relevantes tomadas durante el desarrollo. No basta con saber qué se eligió: hay que saber por qué y qué se descartó.

| # | Decisión | Alternativas consideradas | Por qué esta opción | Fase |
|---|---|---|---|---|
| 1 | Monorepo con npm workspaces | repo único plano, pnpm workspaces, turborepo | npm workspaces nativo sin dependencias extra; suficiente para 3 paquetes. Turborepo añade complejidad innecesaria a esta escala. | 0 |
| 2 | parse5 para parseo HTML | cheerio, jsdom, linkedom | parse5 es el parser que usa el estándar WHATWG; más fiel a HTML malformado real que cheerio (que envuelve htmlparser2). jsdom es demasiado pesado para un linter que no necesita DOM completo. | 0 |
| 3 | Vitest para testing | Jest, node:test | Vitest comparte config con el tooling de Vite, soporte nativo de ESM y TypeScript sin config extra. Consistente con otros proyectos del portfolio (Trainlog, SEO Compass). | 0 |
| 4 | Reglas como funciones puras `(doc, ctx) => Finding[]` | clases con herencia, visitor pattern sobre AST | Funciones puras son más simples de testear en aislamiento y más fáciles de entender para contribuidores. El visitor pattern añade abstracción innecesaria cuando cada regla necesita acceso libre al DOM. | 0 |
| 5 | Zod para validación de config | ajv + JSON Schema, joi, manual | Zod tiene inferencia de tipos TypeScript nativa — la config queda tipada sin duplicar el schema. Más ligero que ajv para este caso de uso. | 0 |
