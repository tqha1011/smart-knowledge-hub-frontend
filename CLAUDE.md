# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

WorkSync frontend — a React SPA for a collaborative workspace/kanban product (see branch-name examples in `CONTRIBUTING.md`: login, workspace UI, kanban board, task modal, socket client). The repo is currently **scaffolding only**: `src/App.tsx` and `src/App.css` are still the stock Vite starter, and `src/components`, `src/pages`, `src/services`, `src/types` contain only `.gitkeep`. `README.md` is the unmodified Vite template README, not project documentation.

Dependencies are installed for the intended stack but not yet wired up: `react-router-dom`, `axios`, `framer-motion`, `lucide-react`, `react-toastify`, `tailwindcss` v4.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build  (type errors fail the build)
npm run lint       # eslint .
npm run preview    # serve the production build
```

There is **no test runner configured** — no vitest/jest, no test script, no test files. If tests are needed, that's a setup task, not an existing workflow.

`npm run lint` does not typecheck (ESLint uses the non-type-aware `tseslint.configs.recommended`). Run `npm run build` to catch type errors. CI (`.github/workflows/frontend_ci.yml`) runs exactly `npm ci && npm run lint && npm run build` on push/PR to `develop` and `main`.

Node >= 24 is required (`engines`, and CI/Docker both pin Node 24).

## Known gaps to be aware of

- **Tailwind is not actually compiling.** `src/index.css` has `@import "tailwindcss"` and `@tailwindcss/vite` is a dependency, but `vite.config.ts` only registers `react()`. The plugin must be added to `plugins` before any utility class works.
- `CONTRIBUTING.md` refers to a `.env.example`; it does not exist yet.

## Toolchain constraints

- **TypeScript 6, bundler mode.** `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`. `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` (no enums, no parameter properties) are enforced and will fail the build.
- **Prettier runs with defaults** — `.prettierrc` only registers `prettier-plugin-tailwindcss` (which auto-sorts class names). Don't fight the formatter; `lint-staged` rewrites staged files on commit.
- **Husky hooks are active**: `pre-commit` runs `lint-staged` (eslint --fix on `*.{ts,tsx}`, prettier on `*.{js,jsx,ts,tsx,json,css,md}`); `commit-msg` runs commitlint with `@commitlint/config-conventional` plus a **10-character minimum subject length**. Commit messages like `fix: typo` will be rejected.

## Git workflow

From `CONTRIBUTING.md` — deviating from this breaks the team's process:

- Never push directly to `main`. Branch from `develop`, PR into `develop`.
- Branch prefixes: `feature/`, `fix/`, `docs/`, `chore/`.
- Commits: `<type>: <description>` (feat, fix, refactor, docs, style, test, chore).

## Code organization conventions

The `src/` subdirectories exist to enforce a layering the team agreed on:

- `services/` — all Axios calls. UI components must not call Axios directly when a service exists, and API URLs must never be hard-coded (read from `import.meta.env.VITE_*`).
- `pages/` — page-level screens; `components/` — reusable UI; `types/` — shared types.

Environment variables must be `VITE_`-prefixed. Note that these are **baked in at build time** — the `Dockerfile` passes `VITE_API_BASE_URL` as a build ARG, so changing the API URL requires a rebuild, not a container restart. Production serves the static `dist/` via nginx with SPA history fallback (`nginx.conf`).

## Design system

`DESIGN.md` is the source of truth for visual design: a full token set (colors, Inter-based type scale, 8px spacing scale, radii) in the frontmatter, plus written rules for elevation, layout grids, and component specs (buttons, role badges, input fields, cards, data tables, chips). These tokens are **not yet expressed in a Tailwind theme** — when setting up Tailwind v4's `@theme`, derive the values from `DESIGN.md` rather than inventing new ones.
