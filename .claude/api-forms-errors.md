## API And Auth

Use `src/services/api.ts` as the shared Axios instance.

Rules:

- Configure base URL through `VITE_API_BASE_URL`; fallback is currently `http://localhost:3000/api`.
- Keep `withCredentials: true` unless backend auth behavior changes.
- Store access tokens consistently with the existing key: `accessToken`.
- Let the Axios request interceptor attach bearer tokens for protected endpoints.
- Auth endpoints should not receive the bearer token; `api.ts` already skips URLs containing `/auth/` or ending with `/auth`.
- Normalize Axios errors in services into `ApiErrorResponse`-like objects so pages can show user-friendly toast messages.

Do not leak raw Axios error objects into UI components.

## Forms And Validation

Current forms are controlled with `useState`.

Rules:

- Validate obvious client-side constraints before API calls, such as empty fields and password confirmation.
- Keep backend validation as the source of truth for domain-level rules.
- Display user-facing errors with `react-toastify`.
- Avoid `any` in catch blocks when practical. Prefer a small helper/type guard if error handling grows.
- Clear form fields only after successful actions.

## Errors And Toasts

Use `react-toastify` for user notifications.

Rules:

- Show success toast after successful user actions.
- Show validation and API errors with readable messages.
- Avoid duplicate toasts for the same action. Prefer either the service or the page owning the toast, not both.
- Keep `ToastContainer` centralized in `App.tsx`.
