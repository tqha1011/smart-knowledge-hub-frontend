# Frontend Contributing Guide

## Branch Strategy

- `main`: stable branch for production/demo-ready code.
- `develop`: main frontend development branch.
- `feature/*`: for new frontend features.
- `fix/*`: for frontend bug fixes.
- `docs/*`: for documentation changes.
- `chore/*`: for setup, config, dependencies, or CI/CD.

Examples:

```txt
feature/login-page
feature/workspace-ui
feature/kanban-board
feature/task-modal
feature/socket-client
fix/login-validation
docs/update-frontend-guide
chore/setup-tailwind
```

---

## Commit Convention

Use this format:

```txt
<type>: <short description>
```

Common types:

```txt
feat: add new frontend feature
fix: fix a frontend bug
refactor: improve frontend code structure without changing behavior
docs: update documentation
style: formatting only
test: add or update tests
chore: setup, config, dependencies, CI/CD
```

Examples:

```txt
feat: add login page
feat: add workspace list page
feat: add kanban drag and drop
fix: handle login form validation
refactor: extract task card component
docs: update frontend setup guide
chore: add prettier config
```

---

## Pull Request Rules

- Do not push directly to `main`.
- Create a new branch from `develop`.
- Create a pull request into `develop`.
- Keep pull requests small and focused.
- Write a clear PR summary.
- Add screenshots or short demo videos for UI changes.
- Request review from the other team member.
- Make sure the app runs locally before requesting review.
- Merge only when the pull request is approved.
- Make sure CI passes before merging.

---

## Frontend Code Guidelines

- Use TypeScript consistently.
- Use clear component, variable, and function names.
- Keep components small and focused.
- Move reusable UI into `components/`.
- Move page-level screens into `pages/`.
- Move API calls into `services/`.
- Move shared types into `types/`.
- Do not call Axios directly inside UI components if a service exists.
- Do not hard-code API URLs.
- Do not commit `.env`, secrets, or sensitive files.
- Do not commit `node_modules`.
- Remove debug `console.log` before merging.
- Handle loading and error states clearly.
- Keep styling consistent with the project UI.

---

## Environment Variables

- Use `.env.example` to document required frontend environment variables.
- Do not commit `.env`.
- Vite environment variables must start with `VITE_`.

Example:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Review Checklist

Before approving a pull request, check:

- The UI works as expected.
- The main flow was tested manually.
- The code is readable and maintainable.
- Components are not unnecessarily large.
- API calls are placed in service files.
- No sensitive files are committed.
- No obvious console errors appear in the browser.
- Screenshots or demo videos are included for UI changes.
- Documentation was updated if needed.

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

Before creating a pull request, run:

```bash
npm run lint
npm run build
```

If a script is not available in the project, skip it and mention that in the pull request.
