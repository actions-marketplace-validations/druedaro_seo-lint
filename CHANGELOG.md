# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
