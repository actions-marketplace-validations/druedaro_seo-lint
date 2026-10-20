# seo-lint

> Linter de SEO técnico y GEO (Generative Engine Optimization) para builds estáticos en CI/CD. Cero navegadores, sin red, ultrarrápido.

[![CI](https://github.com/druedaro/seo-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/druedaro/seo-lint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## El problema

Una etiqueta `canonical` con URL relativa, un `hreflang` roto sin reciprocidad, un `robots.txt` que bloquea por error las páginas de tu `sitemap.xml`, o una página renderizada únicamente por JavaScript sin contenido estático legible para motores de búsqueda y crawlers de IA.

Herramientas como Lighthouse o Screaming Frog son excelentes para auditorías puntuales, pero en un pipeline de CI/CD:
- Son lentas porque requieren levantar un navegador completo (`puppeteer`/`playwright`).
- Son complejas de configurar como tests deterministas de build.
- No cubren bien validaciones de reciprocidad de internacionalización (i18n) ni optimizaciones de **GEO** (`llms.txt`, acceso a modelos de IA).

**`seo-lint` audita directamente los archivos HTML generados en tu carpeta de salida (`dist/`, `build/`, `out/`) en milisegundos y falla el build en CI si alguna regla se rompe.**

---

## Salida de ejemplo

```bash
$ npx seo-lint dist/

dist/blog/post-1.html
  1:1       error    Missing <link rel="canonical"> element.  canonical-present
  1:1       warning  Missing <meta property="og:image"> tag.  og-tags-complete

sitemap.xml
  1:1       error    Sitemap URL "https://example.com/secret" is blocked by robots.txt  sitemap-robots-consistency

llms.txt
  1:1       warning  llms.txt is missing a top-level H1 title (e.g. '# Project Name').  llms-txt-present

✖ 4 problems (2 errors, 2 warnings) across 14 files.
```

Exit code: `1` si hay algún error (o si los warnings superan `--max-warnings`), `0` si todo está limpio.

---

## Inicio rápido

No requiere instalación previa. Puedes ejecutarlo directamente con tu gestor de paquetes favorito:

```bash
# Con npx
npx seo-lint dist/

# Con pnpm
pnpm dlx seo-lint dist/

# Con yarn
yarn dlx seo-lint dist/
```

O instalarlo como dependencia de desarrollo:

```bash
npm install -D seo-lint
# o con pnpm
pnpm add -D seo-lint
```

Y añadirlo a tus scripts de `package.json`:

```json
{
  "scripts": {
    "build": "astro build",
    "postbuild": "seo-lint dist/"
  }
}
```

---

## Catálogo de reglas (21 reglas de la v1)

### Meta
- `title-present`: `<title>` presente y con longitud recomendada (10–60 caracteres).
- `description-present`: `<meta name="description">` presente y con longitud adecuada (50–160 caracteres).
- `canonical-present`: `<link rel="canonical">` presente, absoluto y válido.
- `og-tags-complete`: `og:title`, `og:description` y `og:image` presentes y completos.

### Estructura
- `single-h1`: Exactamente un único `<h1>` por página.
- `heading-order`: Jerarquía de encabezados coherente sin saltos de nivel (ej. `h2` a `h4`).
- `img-alt-present`: Toda imagen de contenido cuenta con atributo `alt` (excluye decorativas con `alt=""`).
- `lang-attribute`: Atributo `lang` presente en `<html>` con código BCP 47 válido.

### Internacionalización (i18n)
*Se activan condicionalmente si el build analizado contiene etiquetas `hreflang`.*
- `hreflang-reciprocal`: Si la página A referencia a B con hreflang, B debe referenciar de vuelta a A.
- `hreflang-valid-codes`: Códigos de idioma y región compatibles con ISO 639-1 / BCP 47.
- `hreflang-self-reference`: Cada página se referencia a sí misma dentro del bloque hreflang.

### Datos estructurados
- `jsonld-valid-syntax`: Bloques `<script type="application/ld+json">` parsean sin errores de sintaxis JSON.
- `jsonld-valid-type`: El `@type` existe en el vocabulario oficial de Schema.org.
- `jsonld-required-fields`: Comprueba campos obligatorios según el tipo (ej. `Article` requiere `headline` y `datePublished`).

### Enlaces
- `no-broken-internal-links`: Todo enlace interno (`<a href="...">`) resuelve a un archivo real en la carpeta analizada.
- `no-redirect-chains`: Enlaces internos no apuntan a páginas con redirecciones cliente (meta refresh).

### Sitemap & Robots
- `sitemap-robots-consistency`: URLs presentes en `sitemap.xml` no están bloqueadas por directivas `Disallow` en `robots.txt`.
- `sitemap-valid-urls`: Todas las URLs declaradas en el sitemap se corresponden con archivos existentes en el build.

### GEO (Generative Engine Optimization)
- `llms-txt-present`: Detecta o valida `llms.txt` en la raíz con estructura Markdown válida y título H1 principal.
- `ai-crawler-access`: Verifica que `robots.txt` no bloquee inadvertidamente crawlers de IA conocidos (`GPTBot`, `ClaudeBot`, etc.).
- `extractable-content`: Comprueba que el contenido principal no dependa exclusivamente de renderizado JavaScript cliente en el navegador.

---

## Configuración (`seo-lint.config.json`)

Puedes personalizar reglas, ignorar rutas o ajustar severidades creando un archivo `seo-lint.config.json` en la raíz de tu proyecto:

```json
{
  "dist": "dist",
  "ignore": ["admin/", "drafts/"],
  "maxWarnings": 0,
  "rules": {
    "llms-txt-present": "error",
    "description-present": ["warning"],
    "single-h1": "error",
    "og-tags-complete": "off"
  }
}
```

---

## Integración en CI/CD

### GitHub Actions

```yaml
- uses: druedaro/seo-lint@v1
  with:
    dir: 'dist'
    max-warnings: 0
```

Para ver ejemplos y plantillas listas para copiar y pegar en **GitLab CI/CD**, **Bitbucket Pipelines**, **Azure DevOps** y **Jenkins**, consulta la [Guía completa de CI/CD](docs/ci-cd.md).

---

## Opciones de línea de comandos (CLI)

```
Uso: seo-lint [directorio] [opciones]

Argumentos:
  directorio              Directorio a auditar (por defecto: "dist")

Opciones:
  -c, --config <path>    Ruta a archivo de configuración personalizado
  -r, --reporter <type>  Formato de salida: "text", "json", "github" (defecto: "text")
  --max-warnings <num>   Código de salida 1 si los warnings exceden este número
  -v, --version          Muestra la versión instalada
  -h, --help             Muestra la ayuda
```

---

## Licencia

[MIT](LICENSE) © David Rueda
