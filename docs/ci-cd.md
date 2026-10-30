# CI/CD Integration Guide

`seo-lint` is designed to be completely environment-agnostic. Because it runs directly against the already-generated static HTML (`dist/`, `build/`, `out/`), it does not need to spin up a browser or make any external network requests — completing full audits in seconds inside any CI/CD pipeline.

It respects standard Unix exit codes:
- **`0`**: Audit passed with no blocking errors.
- **`1`**: Errors were found (`severity: error`) or the number of warnings exceeded the configured threshold (`--max-warnings`).

---

## 1. GitHub Actions

You can use the official GitHub Action directly or invoke the binary via `npx` / `pnpm dlx`.

### Option A: Official Action (Recommended)

Produces native inline annotations on the Pull Request diff.

```yaml
name: SEO & GEO Audit

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Run seo-lint
        uses: druedaro/seo-lint@v1
        with:
          dir: 'dist'
          max-warnings: 0
```

### Option B: Direct execution via npm / pnpm

```yaml
      - run: npx --yes @druedaro/seo-lint dist/ --reporter github
```

### Option C: Monorepos or Subdirectories (e.g. `frontend/`)

If your frontend or documentation is contained within a subfolder, configure `cache-dependency-path`, `working-directory`, and the target build directory:

```yaml
name: SEO Audit (Subdirectory / Monorepo)

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install & Build
        working-directory: frontend
        run: |
          npm ci
          npm run build

      - name: Run SEO Lint
        uses: druedaro/seo-lint@main
        with:
          working-directory: 'frontend'
          dir: 'dist'
          ignore: 'assets/*'
          max-warnings: 0
```

---

## 2. GitLab CI/CD (`.gitlab-ci.yml`)

In GitLab CI, add an `audit` or `test` stage after building the static site.

```yaml
stages:
  - build
  - test

build_site:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

seo_lint:
  stage: test
  image: node:20
  dependencies:
    - build_site
  script:
    - npx --yes seo-lint dist/
```

If you prefer `pnpm`:

```yaml
seo_lint:
  stage: test
  image: node:20
  dependencies:
    - build_site
  before_script:
    - corepack enable
    - corepack prepare pnpm@latest --activate
  script:
    - pnpm dlx seo-lint dist/
```

---

## 3. Bitbucket Pipelines (`bitbucket-pipelines.yml`)

In Bitbucket Pipelines, define a step that builds and runs the audit against the output folder.

```yaml
image: node:20

pipelines:
  pull-requests:
    '**':
      - step:
          name: Build and Audit SEO
          caches:
            - node
          script:
            - npm ci
            - npm run build
            - npx --yes seo-lint dist/ --max-warnings 0
```

---

## 4. Azure DevOps Pipelines (`azure-pipelines.yml`)

In Azure Pipelines, add a Node/Bash task after the artifact build step.

```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: 'Setup Node.js'

  - script: |
      npm ci
      npm run build
    displayName: 'Build project'

  - script: |
      npx --yes seo-lint dist/ --max-warnings 0
    displayName: 'Run seo-lint audit'
```

---

## 5. Jenkins (`Jenkinsfile`)

In declarative Jenkins pipelines, add a dedicated stage:

```groovy
pipeline {
    agent {
        docker {
            image 'node:20'
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        stage('SEO Audit') {
            steps {
                sh 'npx --yes seo-lint dist/'
            }
        }
    }
}
```
