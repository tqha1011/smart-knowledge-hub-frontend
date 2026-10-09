# Smart Knowledge Hub — Frontend

A React single-page application for an internal knowledge-management portal with role/Space-based permissions and an integrated RAG Assistant that answers questions from internal documents with source citations.

## Features

- **Auth** — email/password login with refresh-token rotation ("keep me signed in" for 30 days), invite-based account provisioning, password reset.
- **Spaces** — department/project-scoped workspaces, each with its own members and roles (`Owner` / `Editor` / `Viewer`).
- **Document Library** — upload, browse, and manage documents per Space, with category filters, processing status, visibility/permission control, and pagination.
- **Members & Roles** — invite members by email, manage roles, paginated member list.
- **Ask AI** — a chat panel backed by a RAG assistant: markdown-formatted answers, source citations, chat history, and a "Needs attention" queue for questions the assistant couldn't confidently answer.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (bundler mode)
- [Vite](https://vite.dev/) for dev/build tooling
- [React Router](https://reactrouter.com/) for routing
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [Axios](https://axios-http.com/) for HTTP, with a shared client handling auth headers and token refresh
- [Framer Motion](https://motion.dev/) for animation
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) for rendering assistant answers
- [react-toastify](https://fkhadra.github.io/react-toastify/) for notifications
- [Lucide](https://lucide.dev/) for icons

## Getting Started

### Prerequisites

- Node.js >= 24
- A running instance of the backend API

### Setup

```bash
npm install
cp .env.example .env   # then fill in the values for your environment
npm run dev
```

The app is served at `http://localhost:5173` by default.

## Environment Variables

| Variable            | Description                 | Default                     |
| ------------------- | --------------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:3000/api` |

Environment variables are baked in at build time — changing `VITE_API_BASE_URL` for a built/deployed app requires a rebuild, not just a restart.

## Available Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR             |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run lint`    | Run ESLint                                     |
| `npm run preview` | Serve the production build locally             |

There is currently no automated test suite configured for this project.

## Project Structure

```
src/
├── components/   # Reusable UI, organized by feature area
├── pages/        # Page-level screens and routing targets
├── services/     # Axios instance and feature API clients
├── shared/       # Cross-cutting helpers (error handling, session storage)
├── types/        # DTOs, API response shapes, shared type exports
├── App.tsx
├── index.css
└── main.tsx
```

## Docker

A production image is built via the included `Dockerfile`, which compiles the app and serves the static build with nginx (SPA history fallback configured in `nginx.conf`):

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t smart-knowledge-hub-frontend .
docker run -p 8080:80 smart-knowledge-hub-frontend
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions, and pull request guidelines.

## License

[MIT](./LICENSE)

## Recruiter demo

Set `VITE_API_BASE_URL=https://your-backend.onrender.com/api` before building. Configure the backend's `CORS_ALLOWED_ORIGINS` with the exact frontend origin and enable `DEMO_ENABLED` only after migrating the DB and preparing Test RAG. The login page discovers demo availability from the API; it requires no hard-coded account or frontend secrets.

Visitors enter with **Vào bản demo**. Each session is a Viewer in the synthetic Test RAG corpus for one hour and 20 accepted questions. Demo tokens use sessionStorage, never refresh, and do not connect realtime. The banner shows time/quota; sample questions fill the composer. Quota exhaustion still permits reading; expiry returns to login. Citation titles open read-only source details and Markdown content. The normal admin-provisioned login continues to work.

```bash
npm test
npm run lint
npm run build
```

Publish `dist` with an SPA fallback to `/index.html`. Backend native Render configuration, migrations, email flag and smoke checklist are documented in the sibling backend's `docs/recruiter-demo.md`. An opt-in real-API React smoke test lives at `src/test/demo-live.test.tsx`; ordinary CI skips it. Run only against a prepared local demo API with real AI and CORS `http://localhost:5179`:

```bash
VITE_API_BASE_URL=http://localhost:3179/api VITE_DEMO_LIVE_TEST=true npm test -- src/test/demo-live.test.tsx
```

That smoke uses one real session and question. Demo startup waits up to 120 seconds, explains cold starts after 8 seconds and never automatically retries session creation.
