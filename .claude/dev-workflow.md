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

## Toolchain constraints

- **TypeScript 6, bundler mode.** `verbatimModuleSyntax` is on — type-only imports must use `import type { X } from '...'`. `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` (no enums, no parameter properties) are enforced and will fail the build.
- **Prettier runs with defaults** — `.prettierrc` only registers `prettier-plugin-tailwindcss` (which auto-sorts class names). Don't fight the formatter; `lint-staged` rewrites staged files on commit.
- **Husky hooks are active**: `pre-commit` runs `lint-staged` (eslint --fix on `*.{ts,tsx}`, prettier on `*.{js,jsx,ts,tsx,json,css,md}`); `commit-msg` runs commitlint with `@commitlint/config-conventional` plus a **10-character minimum subject length**. Commit messages like `fix: typo` will be rejected.

## Git workflow

From `CONTRIBUTING.md` — deviating from this breaks the team's process:

- Never push directly to `main`. Branch from `develop`, PR into `develop`.
- Branch prefixes: `feature/`, `fix/`, `docs/`, `chore/`.
- Commits: `<type>: <description>` (feat, fix, refactor, docs, style, test, chore).
