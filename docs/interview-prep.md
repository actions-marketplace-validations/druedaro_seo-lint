# Preparación de entrevista — CLI de SEO técnico

Documento vivo. Se actualiza en cada fase del proyecto, no al final. La idea es que cuando empieces a entrevistar, esto ya esté escrito y solo haga falta repasarlo.

## El pitch (actualizar según va tomando forma real el proyecto)

**Versión para frontend (30 segundos):**
> "He desarrollado `@druedaro/seo-lint`, una herramienta CLI de linting estático para pipelines de CI/CD que audita el build compilado (`dist/`) de cualquier framework (Astro, Next.js, Vite) en milisegundos sin levantar navegadores headless ni hacer peticiones de red. Funciona igual que ESLint o Prettier pero para SEO técnico y GEO: valida 21 reglas críticas (canonisales, enlaces rotos, Schema.org, `llms.txt`, acceso de bots de IA) y bloquea el Pull Request con anotaciones inline si alguien introduce una regresión antes de desplegar a producción."

**Versión para SEO técnico (30 segundos):**
> "Es un linter automatizado que traslada las auditorías de SEO técnico a la fase de pre-producción dentro del flujo de desarrollo. A diferencia de Lighthouse o un crawler tradicional que son lentos y reactivos, `seo-lint` analiza el HTML compilado en milisegundos y resuelve problemas complejos que otras herramientas omiten: valida reciprocidad bidireccional de `hreflang` entre todas las páginas del sitio, consistencia estricta entre `robots.txt` y `sitemap.xml`, sintaxis y tipos de Schema.org en JSON-LD, y optimización para motores generativos (GEO) como `llms.txt` y directivas de rastreo para bots de IA."

## Por qué este proyecto y no otro

- **Cubre el puente entre ingeniería frontend y SEO técnico:** Pocos perfiles combinan arquitectura de software moderna (TypeScript estricto, monorepos, GitHub Actions, empaquetado npm con provenance) con criterio profundo de indexabilidad y rastreo.
- **Resuelve un dolor real de negocio:** En mi experiencia en agencia (tbb Agency, Barcelona Activa), el gran problema del SEO técnico no es auditar webs caídas, sino **prevenir regresiones silenciosas**: cambios en componentes o templates que rompen canónicos, desconfiguran hreflang o bloquean sitemaps en un PR sin que nadie lo note hasta semanas después en Google Search Console. Este proyecto traslada esa calidad a la izquierda (shift-left testing).

## Decisiones de diseño (ir rellenando a medida que se toman)

| # | Decisión | Alternativas consideradas | Por qué esta opción | Fase |
|---|---|---|---|---|
| 1 | Monorepo con npm workspaces | Monorepo único plano, pnpm workspaces, Turborepo | Workspaces nativos de npm sin dependencias añadidas; sobrado para 3 paquetes (`core`, `cli`, `action`). Turborepo añadía complejidad innecesaria en esta escala. | 0 |
| 2 | `parse5` para parseo HTML | cheerio, jsdom, linkedom | `parse5` es el parser que implementa la especificación WHATWG; más fiel al estándar ante HTML malformado del mundo real que cheerio (basado en htmlparser2). `jsdom` es demasiado pesado para un linter de build. | 0 |
| 3 | Vitest para testing | Jest, node:test | Comparte configuración con el ecosistema Vite, soporte nativo ESM y TypeScript sin configuración extra. Coherente con otros proyectos del portfolio (Trainlog, SEO Compass). | 0 |
| 4 | Reglas como funciones puras `(doc, ctx) => Finding[]` | Clases con herencia, visitor pattern sobre AST | Las funciones puras son triviales de testear en aislamiento y fáciles de auditar. El patrón visitor añade abstracción innecesaria cuando cada regla necesita acceso libre a partes concretas del DOM. | 0 |
| 5 | Zod para validación de configuración | ajv + JSON Schema, joi, validación manual | Zod ofrece inferencia de tipos nativa en TypeScript — la config está tipada sin duplicar esquemas ni tipos. | 0 |
| 6 | Activación condicional con `appliesTo(context)` | Ejecutar todas las reglas siempre, configuración manual requerida | Reglas específicas como `hreflang-reciprocal` solo se evalúan si el build analizado contiene etiquetas `hreflang`. En sitios monolingües no generan ruido ni consumen ciclos. | 1 |
| 7 | Inclusión de `filePath` en el mensaje de anotación de GitHub | Dejar solo metadato `::error file=...::` | GitHub Actions crea la anotación visual en el PR diff pero oculta la ruta en los logs planos de la consola. Incluir `dist/...: [rule] mensaje` garantiza que logs crudos y consolas mantengan el contexto del archivo afectado. | 1 |

## Problemas reales que surgieron (no lo que salió perfecto)

1. **El efecto multiplicador del SSG en componentes globales (Footer con 26 errores en `forma-atelier`):**
   - *Problema:* Al auditar un proyecto Astro real (`forma-atelier`), un enlace roto a `/LICENSE` ubicado en el `<Footer />` compartido provocó 26 errores idénticos en las 26 páginas compiladas.
   - *Diagnóstico y aprendizaje:* Las reglas fueron 100% precisas (cero falsos positivos, el error existía), pero reveló un reto de UX inherente a auditar artefactos estáticos compilados en lugar de código fuente. Llevó a plantear modos de reporte compactos que agrupen o dedupliquen ocurrencias de enlaces globales recurrentes.
2. **Pérdida de contexto de ruta en GitHub Actions:**
   - *Problema:* Al usar `--reporter github`, en la consola de CI se leía `Error: [no-broken-internal-links] Internal link "/LICENSE" does not resolve...` sin indicar qué archivo lo causaba, porque el runner de GitHub parsea la instrucción `file=` internamente para la UI de diffs pero la descarta del stdout de la consola.
   - *Solución:* Modificar el reporter para inyectar explícitamente `${f.filePath}` en el texto del mensaje (`::error file=...::dist/index.html: [rule] msg`).
3. **Preservación de assets en `allFiles` al aplicar patrones de exclusión (`ignore`):**
   - *Problema:* Al ignorar rutas auxiliares (ej. `assets/*` o `admin/`), el scanner inicialmente las purgaba de la lista global de archivos. Esto provocaba que reglas como `og-tags-complete` o `no-broken-internal-links` marcasen como enlaces rotos o imágenes faltantes recursos válidos que residían en esas carpetas.
   - *Solución:* Separar en el scanner los archivos a auditar (filtrados por ignore) del catálogo total de archivos existentes (`allFiles`), permitiendo resolver referencias hacia assets ignorados.
4. **Falsos positivos en páginas de error 404 y páginas con directiva `noindex`:**
   - *Problema:* Páginas como `404.html` carecen intencionadamente de `canonical` y a menudo de metadatos completos de Open Graph.
   - *Solución:* Excluir explícitamente páginas 404 y aquellas con `<meta name="robots" content="noindex">` de las reglas `canonical-present` y `og-tags-complete`.
5. **Configuración de CI en monorepos y subcarpetas (`frontend/`):**
   - *Problema:* En proyectos con frontend anidado, `actions/setup-node` falla si no encuentra el lockfile en la raíz (`Dependencies lock file is not found`), y los comandos de build deben correr en el subdirectorio correspondiente.
   - *Solución:* Documentar la receta oficial con `cache-dependency-path: frontend/package-lock.json`, `working-directory: frontend`, y añadir soporte nativo para el input `working-directory` en la propia GitHub Action.
6. **Falsos positivos en enlaces internos con adaptadores SSR/Vercel (Astro + `@astrojs/vercel`):**
   - *Problema:* Al auditar `forma-atelier`, los enlaces internos (`/`, `/collections`) generaron falsos positivos de `no-broken-internal-links`. Con adaptadores serverless/híbridos, Astro compila los archivos estáticos en `dist/client/` y las funciones en `dist/server/`. Al configurar `dir: 'dist'`, el linter buscaba `collections/index.html` en la raíz de `dist/` en vez de en `client/`.
   - *Solución:* Implementar auto-detección inteligente en el scanner. Si `dist/index.html` no existe en la raíz pero sí en `dist/client/` (Astro con Vercel/Cloudflare/Node) o `.output/public/` (Nuxt), el linter reasigna automáticamente el root del documento a la subcarpeta cliente, eliminando el 100% de los falsos positivos de forma transparente.

## Preguntas que probablemente te hagan, y tu respuesta

**"¿Por qué construiste esto en vez de usar Lighthouse CI?"**
- Lighthouse CI es fantástico para Core Web Vitals y rendimiento en cliente, pero para auditorías de SEO técnico en builds tiene grandes limitaciones:
  1. **Velocidad y recursos:** Lighthouse levanta una instancia completa de Chromium (Puppeteer/Playwright) y requiere un servidor web local para servir los ficheros. Añade minutos a cada pipeline. `seo-lint` corre directamente sobre el sistema de archivos analizando el AST de HTML con `parse5` en fracciones de segundo.
  2. **Alcance de SEO técnico:** Lighthouse solo comprueba etiquetas individuales aisladas básicas. No comprueba reciprocidad cruzada de `hreflang` entre todas las páginas del build, no cruza directivas de `robots.txt` contra URLs declaradas en `sitemap.xml`, ni verifica optimizaciones modernas de GEO (`llms.txt` y acceso de bots de IA).

**"¿Cómo decidiste qué reglas incluir?"**
- Agrupé las 21 reglas con un criterio estricto: solo incluir reglas que tengan un impacto directo demostrable en indexabilidad, rastreo o renderizado, descartando heurísticas subjetivas (como densidad de palabras clave o longitud de párrafos) que generan ruido y destruyen la confianza del desarrollador.
- Incluí categorías clásicas (Meta, Estructura, i18n, Datos Estructurados con Schema.org, Enlaces, Sitemaps/Robots) y añadí la categoría **GEO (Generative Engine Optimization)** para auditar `llms.txt`, acceso a crawlers como GPTBot o ClaudeBot, y contenido extraíble sin ejecución de JS.

**"¿Qué harías distinto si lo volvieras a hacer?"**
- Implementaría desde el inicio un sistema de deduplicación/agrupación en el reporter para enlaces rotos globales en componentes compartidos (SSG Footers/Headers), evitando la repetición de N errores idénticos en sitios con muchas páginas.
- Si el producto creciera para sitios con decenas de miles de páginas HTML estáticas, implementaría un pool de workers con Node.js `worker_threads` para paralelizar el parseo de archivos por lotes sin saturar el hilo principal.

**"¿Cómo usaste IA en el desarrollo? ¿Qué partes son tuyas?"**
- Yo definí la arquitectura completa (monorepo con workspaces, `parse5` sobre cheerio, ejecución condicional, tipado estricto con TypeScript y Zod), el catálogo de las 21 reglas y los contratos de datos `(doc, ctx) => Finding[]`.
- Usé la IA como copiloto de ejecución: redactaba la especificación técnica de cada regla (entradas esperadas, casos válidos, casos límite) y solicitaba la implementación inicial y los fixtures de prueba.
- Cada línea generada fue revisada, depurada y adaptada por mí (como la resolución de directory index en enlaces internos, la ampliación de jerarquías de tipos en Schema.org, o el manejo de rutas relativas con trailing slashes).

**"¿Qué regla te costó más implementar bien?"**
- `hreflang-reciprocal`: A diferencia de la mayoría de reglas que operan sobre una sola página, hreflang requiere un contexto global de todo el sitio. Hay que mapear todas las declaraciones de todas las páginas, resolver equivalencias de URLs absolutas y relativas con y sin trailing slash, y verificar bidireccionalidad estricta (`A -> B` exige `B -> A`).
- `canonical-present`: Normalizar URLs absolutas con dominios de producción frente a rutas relativas en disco local, distinguiendo cuándo una URL es auto-referencial y cuándo apunta a otra versión canónica, omitiendo páginas no indexables o de error.

**"¿Cómo sabes que las reglas funcionan de verdad y no solo en tus ejemplos?"**
- **213 tests automatizados** en Vitest con cobertura de casos válidos, inválidos y casos extremos (HTML malformado, JSON-LD con sintaxis rota, enlaces relativos complejos).
- **Integración continua real en `astro-seo-theme`** con la GitHub Action oficial.
- **Validación en un proyecto real independiente (`forma-atelier`)**, donde auditó 26 páginas y detectó 26 ocurrencias de un enlace roto real (`/LICENSE`) en el footer compilado con **0 falsos positivos**.

## Métricas para enseñar (rellenar cuando existan)

- **Número de reglas implementadas:** 21 reglas completas en v1 (Meta, Estructura, i18n, Schema.org, Enlaces, Sitemap/Robots, GEO).
- **Cobertura de tests:** 213 tests pasando al 100% (201 en `@seo-lint/core`, 12 en `@druedaro/seo-lint`).
- **Paquete publicado en npm:** [`@druedaro/seo-lint`](https://www.npmjs.com/package/@druedaro/seo-lint) (v0.1.2) con build optimizado vía esbuild y provenance configurado.
- **GitHub Action oficial:** Publicada y disponible en GitHub Marketplace (`druedaro/seo-lint`).
- **Validación en proyectos reales:** Probado en `astro-seo-theme` y `forma-atelier` (26 páginas auditadas, 100% errores reales detectados, 0 falsos positivos).
- **Rendimiento:** Auditorías completas en menos de 1 segundo en local y CI, sin dependencias de navegadores ni red.

## Relación con el resto del portfolio

Cómo conecta este proyecto con SEO Compass, astro-seo-theme y la experiencia en tbb Agency / Barcelona Activa:

- **tbb Agency & Barcelona Activa:** La experiencia práctica con clientes donde las roturas de SEO en producción tenían un coste directo en tráfico y facturación. Permitió identificar exactamente qué errores de desarrollo provocaban pérdidas orgánicas.
- **SEO Compass:** El proyecto de análisis, visualización e inteligencia de datos SEO.
- **astro-seo-theme:** Demuestra la implementación de buenas prácticas de arquitectura web estática y rendimiento en un framework moderno (Astro).
- **@druedaro/seo-lint:** El eslabón de infraestructura y automatización que une el desarrollo frontend con el SEO técnico, asegurando que los estándares de calidad definidos en los templates y auditorías se garanticen de manera determinista en el pipeline de CI/CD.

## Checklist antes de la primera entrevista

- [x] Pitch de frontend y de SEO escritos y ensayados en voz alta
- [x] Al menos 3 decisiones de diseño documentadas con su "por qué" (7 documentadas)
- [x] Al menos 1 problema real resuelto, contado con detalle técnico (5 documentados)
- [x] README del repo revisado como si lo leyera un desconocido
- [ ] Repo pineado en el perfil de GitHub junto a los otros proyectos relevantes
