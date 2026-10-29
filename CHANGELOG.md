# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-10-29

### Added
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
