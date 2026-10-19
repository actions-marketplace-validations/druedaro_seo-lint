# Plan de implementación — CLI de SEO técnico

Sin límite de tiempo fijo: el objetivo es la mejor versión posible del producto, no una fecha. Cada fase termina cuando está sólida, no cuando se acaba una semana.

## 0. Definición del producto

**Nombre de trabajo:** `seo-lint` (cambiar antes de publicar si ya existe en npm).

**Pitch en una frase:** un linter de SEO técnico y GEO que audita el HTML ya generado (`dist/`) de cualquier framework, y falla el build en CI si se rompe una regla.

**Diferenciador frente a Lighthouse CI / Unlighthouse / Screaming Frog:**
- No necesita navegador ni red: analiza HTML estático, así que corre en segundos dentro de cualquier pipeline.
- Reglas específicas de i18n/hreflang y de GEO (contenido legible por LLMs, `llms.txt`, robots para crawlers de IA), que las herramientas genéricas no cubren bien.
- Pensado como test de build, no como informe: exit code, anotaciones de PR, JSON para integrarlo en otras herramientas.

**No objetivos (para no diluir el producto):**
- No es un crawler que rastrea un sitio en producción (eso ya lo hace Screaming Frog).
- No mide performance ni Core Web Vitals (eso ya lo hace Lighthouse).
- No tiene dashboard ni backend en la v1.

## 1. Arquitectura

```
seo-lint/
├── packages/
│   ├── core/              # motor de reglas, tipos, parser HTML
│   │   ├── src/
│   │   │   ├── rules/     # un módulo por regla
│   │   │   ├── engine.ts  # orquesta reglas sobre un árbol DOM
│   │   │   ├── parser.ts  # wrapper sobre parse5/cheerio
│   │   │   └── types.ts
│   │   └── test/
│   ├── cli/               # binario, lectura de config, reporters
│   │   ├── src/
│   │   │   ├── reporters/ # text, json, github-annotations
│   │   │   └── index.ts
│   │   └── test/
│   └── config/            # schema y defaults de seo-lint.config.ts
├── action/                # action.yml + wrapper para GitHub Actions
├── examples/              # proyectos Astro/Next de prueba (fixtures reales)
└── docs/
```

Monorepo con workspaces (npm o pnpm) desde el principio: separa el motor (reusable, testeable) del CLI (I/O) y de la Action (otro consumidor del core). Facilita publicar `@seo-lint/core` por separado si algún día alguien quiere construir encima.

**Decisiones técnicas:**
- TypeScript estricto, sin `any`.
- `parse5` para el parseo (más fiel al estándar que `cheerio` para casos límite de HTML malformado) con una capa de utilidades tipo-cheerio encima para no pelear con el AST crudo.
- Cada regla es una función pura: `(dom, context) => Finding[]`. Sin estado compartido, fácil de testear en aislamiento.
- Activación condicional: algunas reglas (ej. las de i18n) declaran un `appliesTo(context)` que el engine evalúa antes de ejecutarlas — así un sitio monolingüe no recibe hallazgos de hreflang, en vez de tener que desactivarlas a mano en la config.
- Config con Zod para validar `seo-lint.config.ts` y dar errores claros si el usuario la escribe mal.

## 2. Catálogo de reglas (v1 completa)

Metadatos por regla: `id`, `severity` (`error` | `warning`), `category` (`meta` | `structure` | `i18n` | `structured-data` | `links` | `geo`), explicación del porqué y un enlace a la fuente (Google Search Central, etc.).

**Meta**
1. `title-present` — title existe y longitud 10–60 caracteres
2. `description-present` — meta description existe y longitud 50–160 caracteres
3. `canonical-present` — canonical existe, es absoluto y resuelve a una URL válida
4. `og-tags-complete` — og:title, og:description, og:image presentes y coherentes con el contenido

**Estructura**
5. `single-h1` — exactamente un H1 por página
6. `heading-order` — sin saltos de nivel (h2 → h4 sin h3)
7. `img-alt-present` — toda imagen de contenido tiene alt (excluye decorativas con alt="")
8. `lang-attribute` — `<html lang="...">` presente y es un código BCP 47 válido

**i18n** (se activan solo si el engine detecta algún bloque `hreflang` en el `dist/` analizado; en un sitio monolingüe no aparecen ni como warning, para no generar ruido irrelevante)
9. `hreflang-reciprocal` — si A apunta a B, B apunta de vuelta a A
10. `hreflang-valid-codes` — códigos de idioma/región válidos
11. `hreflang-self-reference` — cada página se referencia a sí misma en su propio bloque hreflang

**Datos estructurados**
12. `jsonld-valid-syntax` — el JSON-LD parsea sin errores
13. `jsonld-valid-type` — `@type` existe en el vocabulario de Schema.org
14. `jsonld-required-fields` — campos obligatorios según el tipo (ej. Article necesita headline, datePublished)

**Enlaces**
15. `no-broken-internal-links` — enlaces internos resuelven a una ruta existente en `dist/`
16. `no-redirect-chains` — enlaces internos no apuntan a URLs que a su vez redirigen (si hay info de redirects disponible)

**Sitemap/robots**
17. `sitemap-robots-consistency` — URLs bloqueadas en robots.txt no aparecen en el sitemap
18. `sitemap-valid-urls` — todas las URLs del sitemap devuelven una página real en `dist/`

**GEO (diferenciador)**
19. `llms-txt-present` — existe `llms.txt` y tiene estructura mínima válida
20. `ai-crawler-access` — robots.txt no bloquea accidentalmente crawlers de IA conocidos (GPTBot, ClaudeBot, etc.) salvo que sea intencional
21. `extractable-content` — el contenido principal no depende solo de JS para renderizarse (heurística: compara HTML crudo vs. cantidad de texto esperado)

Esto son 21 reglas razonadas. Si al implementar alguna resulta poco fiable o con muchos falsos positivos, mejor quitarla que dejarla ruidosa — una regla que genera falsos positivos constantes destruye la confianza en la herramienta entera.

## 3. Reporters y salida

- `text` — salida legible en terminal, agrupada por archivo, con color y severidad.
- `json` — estructura estable y documentada, para que otras herramientas consuman el resultado.
- `github` — formato de anotaciones (`::error file=...,line=...::mensaje`) para que aparezcan inline en el PR.
- Exit code 1 si hay algún `error`, 0 si solo hay `warning` (configurable).

## 4. Configuración

`seo-lint.config.ts`:
- `rules`: activar/desactivar y cambiar severidad por regla.
- `ignore`: patrones de rutas a excluir.
- `dist`: carpeta a analizar (default `dist`, pero configurable para Next, Vite, etc.).
- Posibilidad de reglas custom (función que el usuario registra) — esto es opcional y se añade solo si el core ya está sólido, no antes.

## 5. Testing

- Cada regla con fixtures HTML mínimos: un caso que pasa, uno que falla, y los casos límite documentados (ej. hreflang con un solo idioma, JSON-LD con varios bloques en la misma página).
- Tests de integración: correr el CLI completo contra los `examples/` (un proyecto Astro real, uno Next).
- Cobertura alta en `core`, no hace falta perseguir el 100% en `cli`.
- Vitest, que ya dominas por Trainlog y SEO Compass.

## 6. GitHub Action

- `action.yml` fino que instala el paquete y ejecuta el CLI con el reporter `github`.
- Probarla en un workflow real contra `astro-seo-theme`: ese repo pasa a tener un badge de "seo-lint passing", que es la mejor prueba social que puedes enseñar en una entrevista.

## 7. Documentación y publicación

- README que empieza por el problema (qué rompe el SEO de un build y cómo esto lo detecta antes de desplegar), con un ejemplo de salida real, no una lista de features.
- Guía completa de CI/CD (`docs/ci-cd.md`) y recetas en el README con snippets mínimos listos para copiar/pegar:
  - GitLab CI (`.gitlab-ci.yml`) con integración de reportes
  - Bitbucket Pipelines (`bitbucket-pipelines.yml`)
  - Azure DevOps Pipelines (`azure-pipelines.yml`)
  - Jenkins (`Jenkinsfile`)
- Página de cada regla en `docs/rules/` explicando qué comprueba y por qué importa — esto además te sirve como banco de conocimiento para entrevistas.
- Publicación en npm con provenance y `CHANGELOG.md` siguiendo semver desde la v0.1.0.
- Un post técnico (dev.to/Hashnode) una vez la v1 esté publicada, igual que hiciste con Trainlog.

## 8. Orden de trabajo sugerido

1. Monorepo, `core` con el engine y 3 reglas simples (title, description, single-h1) con tests. Objetivo: tener el pipeline completo funcionando de punta a punta con lo mínimo.
2. Resto de reglas de meta/estructura/i18n.
3. Reglas de datos estructurados y enlaces.
4. Reglas de GEO (las más diferenciadoras, pero también las que necesitan más criterio propio).
5. CLI real con reporters y config.
6. GitHub Action + integrarla en `astro-seo-theme`.
7. Documentación, README, publicación en npm.
8. Post técnico y actualización del portfolio.

No hay fechas: cada bloque se da por cerrado cuando los tests pasan y el README de esa parte está escrito, no antes.

## 9. Cómo trabajar con IA en esto sin que se note como "vibe coding" sin criterio

- Tú decides el catálogo de reglas y la arquitectura (ya está aquí); la IA te ayuda a implementar cada regla y sus tests a partir de una especificación que tú escribes primero.
- Para cada regla nueva: escribe primero el contrato (input, output, casos límite) en un comentario o issue, luego pide la implementación. Así el repo refleja tu criterio, no solo lo que la IA propuso.
- Revisa y reescribe el código generado antes de aceptarlo — en una entrevista te van a preguntar por decisiones concretas del código, no solo del diseño.
- Guarda las decisiones de diseño relevantes (por qué parse5 y no cheerio, por qué exit code así, por qué se descartó tal regla) en `docs/decisions.md` a medida que avanzas.
