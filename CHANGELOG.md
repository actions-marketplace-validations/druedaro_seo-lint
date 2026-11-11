# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-11-11

### Fixed
- Fixed CLI `--version` reporting `0.1.0` due to unbundled `package.json` relative path lookup; now resolves across multiple packaging paths and includes `packages/cli/package.json` in distribution files.
- Fixed false-negative in `llms-txt-present`: the rule now warns when `llms.txt` is missing from the site root during audit, without requiring an explicit `<link rel="describedby">` in the HTML.

### Added
- Auto-detection of un-prerendered client-side SPAs (React/Vue with `#root`, `#app`, or `#__next` mount targets in a single `index.html`) with an advisory notice explaining that raw HTML is audited and recommending SSG pre-rendering for dynamic routes.

### Documentation
- Added "Scope & Design Philosophy" section to README defining `seo-lint` as a deterministic static HTML CI gatekeeper, clarifying headless browser exclusion and technical signals vs search ranking guarantees.
- Fixed npm badges to reference `@druedaro/seo-lint`.

## [0.2.0] - 2026-11-04

### Added
- Rule `link-has-accessible-name`: Ensures all `<a>` links have discernible text, `aria-label`, `aria-labelledby`, `title`, or an alt-described image, preventing empty/icon-only links that break WCAG 2.4.4 and hurt search crawlability.
- Rule `meta-viewport-accessible`: Validates `<meta name="viewport">` presence and ensures user zooming is not disabled via `user-scalable=no` or `maximum-scale < 2.0` (WCAG 1.4.4).
- Rule `landmark-main-present`: Verifies documents include exactly one visible `<main>` landmark (or element with `role="main"`), improving screen reader navigation and AI/LLM primary content extraction.
- GitHub Action display name updated to `SEO lint` for better readability across GitHub and Marketplace.

### Performance
- Optimized internal link validation from O(N) linear array scans to O(1) set lookups via `allFilesSet`, dramatically speeding up linting on large static sites.
- Deduplicated candidate path resolution in `no-broken-internal-links` when target paths already end with `.html`.

### Refactored
- Extracted shared repeated broken links detection into `reporters/utils.ts`, removing code duplication between text and GitHub reporters.
- Extracted 300+ Schema.org type definitions from `jsonld-valid-type.ts` into a dedicated data module (`schema-org-types.ts`).

## [0.1.4] - 2026-10-29

### Added
- Auto-detection of framework adapter subdirectories: automatically detects static document roots in `dist/client/` (Astro with `@astrojs/vercel`, Cloudflare, Node adapters) and `.output/public/` (Nuxt 3), eliminating false positive broken internal links in hybrid/SSR deployments.
- GitHub Action `working-directory` input support to easily handle projects inside subdirectories (e.g. `frontend/`).
- Shared component tips in `text` and `github` reporters: automatically identifies when broken internal links recur across 3 or more pages (likely originating in shared Header/Footer layout components).
- Warning alerts when 0 HTML files are found in the target audit directory, preventing silent false-pass builds in CI.

## [0.1.3] - 2026-10-29

### Fixed
- Include file path in GitHub reporter annotation messages (`dist/...: [rule] msg`) so that file locations remain clearly visible in plain-text CI logs and terminal summaries.

### Documentation
- Added GitHub Actions CI/CD configuration recipes for monorepos and subdirectory projects (e.g., `frontend/`) with `cache-dependency-path` and `working-directory`.
- Completed interview preparation guide (`docs/interview-prep.md`) with design decisions, metrics, and real-world validation data.

## [0.1.2] - 2026-10-26

### Fixed
- Preserved asset files in `allFiles` when `--ignore` patterns are applied, avoiding false positives in link and asset resolution.
- Skipped 404 error pages and pages marked with `noindex` in `canonical-present` and `og-tags-complete` rules.

## [0.1.1] - 2026-10-26

### Added
- Directory index resolution for internal links (e.g. `/about/` resolves to `/about/index.html` or `/about.html`).
- Expanded Schema.org vocabulary support in `jsonld-valid-type` to include full schema hierarchy and `@graph` elements.
- Path and glob ignore filtering support via `--ignore` CLI option and config file.

## [0.1.0] - 2026-10-20

### Added
- Core SEO rule engine with support for AST parsing using `parse5`.
- 21 built-in rules across 7 categories:
  - Meta: `title-present`, `description-present`, `canonical-present`, `og-tags-complete`.
  - Structure: `single-h1`, `heading-order`, `img-alt-present`, `lang-attribute`.
  - Internationalization (i18n): `hreflang-reciprocal`, `hreflang-valid-codes`, `hreflang-self-reference`.
  - Structured data: `jsonld-valid-syntax`, `jsonld-valid-type`, `jsonld-required-fields`.
  - Links: `no-broken-internal-links`, `no-redirect-chains`.
  - Sitemap & Robots: `sitemap-robots-consistency`, `sitemap-valid-urls`.
  - GEO (Generative Engine Optimization): `llms-txt-present`, `ai-crawler-access`, `extractable-content`.
- CLI binary (`seo-lint`) with zero runtime overhead.
- Zod-based configuration schema with support for `seo-lint.config.json` and `.js`.
- Multiple output reporters: `text`, `json`, and `github` (with PR inline annotations).
- Official GitHub Action (`action.yml` and `action/action.yml`).
- CI/CD templates and integration guides for GitLab CI, Bitbucket Pipelines, Azure DevOps, and Jenkins.
