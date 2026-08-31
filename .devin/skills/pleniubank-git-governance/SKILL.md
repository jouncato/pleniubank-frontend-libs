---
name: pleniubank-git-governance
description: Política obligatoria de ramas, PRs, CI/CD y GitOps para pleniubank-frontend-libs. Usar antes de crear ramas, hacer commit, abrir/mergear PRs o modificar automatización de publicación.
license: MIT
metadata:
  author: pleniubank
  version: "1.0"
---

# Gobierno Git y publicación

Antes de cualquier operación Git, leer la política canónica en `docs-proyecto-plenibank/guides/DEVOPS_BRANCHING_AND_GITOPS_POLICY.md`.

- `main` es la SSOT; `qa` solo recibe promoción desde `dev`; `main` solo recibe promoción desde `qa`.
- Crear trabajo desde `dev` usando `feature/*`, `bugfix/*` o excepciones controladas `hotfix/*`, `chore/*`, `release/*`.
- No crear nuevas ramas `feat/*`, `fix/*`, `audit/*` ni `claude/*`; son legacy-only.
- No hacer push directo a `main` ni `qa`, ni usar force-push o borrar esas ramas.
- Los tags de publicación de librerías deben generarse desde `main` mediante el release autorizado.
