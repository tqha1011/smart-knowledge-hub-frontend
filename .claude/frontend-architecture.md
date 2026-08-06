## Source Layout

Frontend code lives under `src/`.

```plaintext
src/
├── assets/
├── components/
│   ├── authComponent/
│   └── common/
├── pages/
├── services/
├── types/
│   ├── authType/
│   └── commonType/
├── App.tsx
├── index.css
└── main.tsx
```

Current implemented areas:

- `pages`: login and register pages.
- `components/authComponent`: auth-specific UI components such as `CustomInput` and `QuoteBlock`.
- `components/common`: shared UI helpers such as `PageTransition`.
- `services`: API client setup and auth service calls.
- `types`: DTOs, UI props, and common API error types.

## Architecture Rules

Use a simple feature-oriented frontend structure.

Rules:

- `pages` own page-level state, layout composition, routing targets, and form submit handlers.
- `components` should be reusable UI units. Keep them presentational unless local UI state is truly needed.
- `services` own HTTP calls and API error normalization.
- `types` own DTOs, API response shapes, component props, and shared type exports.
- Do not call `axios` directly from pages or components. Use `services/api.ts` or feature services.
- Do not duplicate token attachment logic. `services/api.ts` already attaches `Authorization: Bearer <token>` for non-auth endpoints.
- Keep route declarations centralized in `App.tsx` until the app grows enough to justify route modules.

## Naming Style

Follow the current names and casing:

- Page files currently use lower camel case with `Page` suffix, such as `loginPage.tsx` and `registerPage.tsx`.
- Components use PascalCase exports, such as `CustomInput` and `QuoteBlock`.
- Services use object exports, such as `authService`.
- DTO types end with `Dto`, such as `LoginDto` and `RegisterDto`.
- Prop interfaces end with `Props`, such as `AuthInputProps`.
- Feature type folders use names such as `authType` and `commonType`.

Prefer keeping imports relative inside `src/`, matching the current codebase.

## Routing

Routes are defined in `App.tsx` with `react-router-dom`.

Current routes:

- `/login`
- `/register`
- empty path redirects to `/login`

When adding pages:

- Add the page under `src/pages`.
- Register the route in `App.tsx`.
- Use `Navigate` for redirects.
- Keep `AnimatePresence` behavior intact unless route animation changes are part of the task.

## Code organization conventions

The `src/` subdirectories exist to enforce a layering the team agreed on:

- `services/` — all Axios calls. UI components must not call Axios directly when a service exists, and API URLs must never be hard-coded (read from `import.meta.env.VITE_*`).
- `pages/` — page-level screens; `components/` — reusable UI; `types/` — shared types.

Environment variables must be `VITE_`-prefixed. Note that these are **baked in at build time** — the `Dockerfile` passes `VITE_API_BASE_URL` as a build ARG, so changing the API URL requires a rebuild, not a container restart. Production serves the static `dist/` via nginx with SPA history fallback (`nginx.conf`).
