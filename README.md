# seo-lint

> Technical SEO and GEO (Generative Engine Optimization) linter for static HTML builds in CI/CD. Zero browsers, no network, ultra-fast.

[![CI](https://github.com/druedaro/seo-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/druedaro/seo-lint/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/seo-lint.svg?style=flat-square)](https://www.npmjs.com/package/seo-lint)
[![npm downloads](https://img.shields.io/npm/dm/seo-lint.svg?style=flat-square)](https://www.npmjs.com/package/seo-lint)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

A `canonical` tag with a relative URL, a broken `hreflang` without reciprocity, a `robots.txt` that accidentally blocks pages in your `sitemap.xml`, or a page rendered exclusively by JavaScript with no static content readable by search engines and AI crawlers.

Tools like Lighthouse or Screaming Frog are excellent for one-off audits, but inside a CI/CD pipeline they are:
- **Slow** — they need to spin up a full browser (`puppeteer`/`playwright`).
- **Complex** — hard to configure as deterministic build tests.
- **Incomplete** — poor coverage of i18n hreflang reciprocity checks and **GEO** optimisations (`llms.txt`, AI model access).

**`seo-lint` audits the HTML files generated in your output folder (`dist/`, `build/`, `out/`) in milliseconds and fails the build in CI if any rule is violated.**

---

## Example Output

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

Exit code: `1` if there are errors (or if warnings exceed `--max-warnings`), `0` if everything is clean.

---

## Quick Start

No prior installation needed. Run it directly with your package manager of choice:

```bash
# With npx
npx @druedaro/seo-lint dist/

# With pnpm
pnpm dlx @druedaro/seo-lint dist/

# With yarn
yarn dlx @druedaro/seo-lint dist/
```

Or install it as a dev dependency:

```bash
npm install -D @druedaro/seo-lint
# or with pnpm
pnpm add -D @druedaro/seo-lint
```

Then add it to your `package.json` scripts:

```json
{
  "scripts": {
    "build": "astro build",
    "postbuild": "seo-lint dist/"
  }
}
```

---

## Rule Catalogue (21 rules in v1)

### Meta
- `title-present`: `<title>` present and within the recommended length (10–60 chars).
- `description-present`: `<meta name="description">` present and within adequate length (50–160 chars).
- `canonical-present`: `<link rel="canonical">` present, absolute, and valid.
- `og-tags-complete`: `og:title`, `og:description`, and `og:image` present and populated.

### Structure
- `single-h1`: Exactly one `<h1>` per page.
- `heading-order`: Coherent heading hierarchy with no level skips (e.g. `h2` → `h4`).
- `img-alt-present`: Every content image has an `alt` attribute (decorative images with `alt=""` are excluded).
- `lang-attribute`: `lang` attribute present on `<html>` with a valid BCP 47 code.

### Internationalisation (i18n)
*Activated conditionally if the analysed build contains `hreflang` tags.*
- `hreflang-reciprocal`: If page A references B with hreflang, B must reference back to A.
- `hreflang-valid-codes`: Language and region codes compliant with ISO 639-1 / BCP 47.
- `hreflang-self-reference`: Each page references itself within its hreflang block.

### Structured Data
- `jsonld-valid-syntax`: `<script type="application/ld+json">` blocks parse without JSON syntax errors.
- `jsonld-valid-type`: The `@type` exists in the official Schema.org vocabulary.
- `jsonld-required-fields`: Checks required fields per type (e.g. `Article` requires `headline` and `datePublished`).

### Links
- `no-broken-internal-links`: Every internal link (`<a href="...">`) resolves to a real file in the analysed folder.
- `no-redirect-chains`: Internal links do not point to pages with client-side redirects (meta refresh).

### Sitemap & Robots
- `sitemap-robots-consistency`: URLs in `sitemap.xml` are not blocked by `Disallow` directives in `robots.txt`.
- `sitemap-valid-urls`: All URLs declared in the sitemap correspond to existing files in the build.

### GEO (Generative Engine Optimization)
- `llms-txt-present`: Detects or validates `llms.txt` at the root with valid Markdown structure and a primary H1 title.
- `ai-crawler-access`: Checks that `robots.txt` does not inadvertently block known AI crawlers (`GPTBot`, `ClaudeBot`, etc.).
- `extractable-content`: Verifies that the main content does not depend exclusively on client-side JavaScript rendering.

---

## Configuration (`seo-lint.config.json`)

Customise rules, ignore paths, or adjust severities by creating a `seo-lint.config.json` file at the root of your project:

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

## CI/CD Integration

### GitHub Actions

Add this step to your workflow (e.g. `.github/workflows/seo-audit.yml`):

```yaml
- name: Run SEO Lint
  uses: druedaro/seo-lint@main
  with:
    dir: 'dist'
    ignore: 'assets/*,404.html' # Optional: comma-separated ignore patterns
    max-warnings: 0             # Optional: fail build if warnings exceed this number
```

#### Monorepos or Subdirectories (e.g. `frontend/`)

If your site lives inside a subfolder, configure `cache-dependency-path`, `working-directory`, and the target `dir`:

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json

- name: Build
  working-directory: frontend
  run: |
    npm ci
    npm run build

- name: Run SEO Lint
  uses: druedaro/seo-lint@main
  with:
    dir: 'frontend/dist'
    ignore: 'assets/*'
```

For copy-paste-ready examples for **GitLab CI/CD**, **Bitbucket Pipelines**, **Azure DevOps**, and **Jenkins**, see the [full CI/CD guide](docs/ci-cd.md).

---

## CLI Options

```
Usage: seo-lint [directory] [options]

Arguments:
  directory               Directory to audit (default: "dist")

Options:
  -c, --config <path>    Path to a custom configuration file
  -i, --ignore <pattern> Comma-separated glob patterns to ignore (e.g. "404.html,assets/*")
  -r, --reporter <type>  Output format: "text", "json", "github" (default: "text")
  --max-warnings <num>   Exit code 1 if warnings exceed this number
  -v, --version          Show installed version
  -h, --help             Show help
```

---

## License

[MIT](LICENSE) © David Rueda
