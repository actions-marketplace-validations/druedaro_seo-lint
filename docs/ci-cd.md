# Guía de Integración en CI/CD

`seo-lint` está diseñado para ser completamente agnóstico al entorno de ejecución. Al ejecutarse directamente sobre el HTML estático ya generado (`dist/`, `build/`, `out/`), no necesita levantar navegadores pesados ni realizar peticiones de red externas, completando auditorías completas en segundos dentro de cualquier pipeline de integración continua.

Respeta los códigos de salida estándar de Unix:
- **`0`**: Auditoría exitosa sin errores bloqueantes.
- **`1`**: Se detectaron errores (`severity: error`) o la cantidad de advertencias superó el umbral configurado (`--max-warnings`).

---

## 1. GitHub Actions

Puedes utilizar directamente la GitHub Action oficial o invocar el binario vía `npx` / `pnpm dlx`.

### Opción A: Usando la Action oficial (Recomendado)

Genera anotaciones nativas inline en el diff del Pull Request.

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

### Opción B: Ejecución directa con npm / pnpm

```yaml
      - run: npx --yes seo-lint dist/ --reporter github
```

---

## 2. GitLab CI/CD (`.gitlab-ci.yml`)

En GitLab CI, añade una etapa `audit` o `test` después de compilar el sitio estático.

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

Si prefieres usar `pnpm`:

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

En Bitbucket Pipelines, define un paso que compile y ejecute la auditoría sobre la carpeta de salida.

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

En Azure Pipelines, añade una tarea Node/Bash tras la compilación del artefacto.

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

En pipelines declarativos de Jenkins, añade un stage dedicado:

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
