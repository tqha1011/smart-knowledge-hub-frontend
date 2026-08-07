## Project state

Smart Internal Knowledge Portal frontend — a React SPA for an internal knowledge-management system with role/Space-based permissions and an integrated RAG Assistant (answers questions from internal documents with source citations). The UI design is specified in `docs/superpowers/specs/2026-08-05-knowledge-portal-ui-design.md` — read it before building any screen; it defines the color/type tokens, the portal shell, Document Library, and the Ask AI panel.

The repo was originally scaffolded for a different product ("WorkSync", a kanban/collaboration tool — see branch-name examples in `CONTRIBUTING.md`) and has since been repurposed. Implementation has **not started**: `src/App.tsx` and `src/App.css` are still the stock Vite starter, and `src/components`, `src/pages`, `src/services`, `src/types` contain only `.gitkeep`. `README.md` is the unmodified Vite template README, not project documentation. `package.json`'s `name` (`worksync-frontend`) is a stale leftover from the old product name.

Dependencies are installed for the intended stack but not yet wired up: `react-router-dom`, `axios`, `framer-motion`, `lucide-react`, `react-toastify`, `tailwindcss` v4.

`src/index.css` defines the Tailwind v4 `@theme` matching the design spec: `--color-bg/surface/surface-sunken/border/ink/ink-muted/accent/accent-soft/citation-bg/citation-fg/warn-bg/warn-fg/avatar-bg/avatar-fg`, fonts `--font-display` (Fraunces), `--font-sans` (Manrope), `--font-mono` (IBM Plex Mono), and a `.dark` class block overriding the same custom properties for dark mode — toggle dark mode by adding/removing the `dark` class on `<html>`, no `dark:` variants needed per component. The Fraunces/Manrope/IBM Plex Mono fonts are loaded via Google Fonts `<link>` tags in `index.html`.

## Known gaps to be aware of

- `CONTRIBUTING.md` refers to a `.env.example`; it does not exist yet.

## Roles and permissions

**`Admin` is the only true global role** (a system-wide flag, not tied to any Space). `Editor` and `Employee` are not standalone global roles — they only exist as a per-Space assignment (`SpaceMembership.role`); there's no "Editor" or "Employee" outside the context of a specific Space. A user's permission set is: `isAdmin` (global) + a list of `(Space, role)` pairs. See the design spec for full detail. Don't gate UI on a single global role field when the feature is Space-scoped (documents, knowledge-gap queue) — check the relevant `(Space, role)` pair instead, or `isAdmin` for global actions.
