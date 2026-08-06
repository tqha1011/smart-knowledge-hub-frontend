## Styling

Use Tailwind classes inline, as the current pages and components do.

Rules:

- Preserve the current DevNotes visual direction unless explicitly redesigning: dark blue surfaces, cyan accents, subtle gradients, bordered inputs, and Lucide icons.
- Use `lucide-react` icons for buttons, inputs, and feature markers.
- Keep reusable component styles inside the component.
- Prefer responsive Tailwind utilities over custom CSS.
- Avoid adding global CSS unless it is truly app-wide.
- Ensure text and controls fit on mobile. Login/register forms should remain usable on small screens.

## Components

Component guidelines:

- Use typed props from `src/types` when a prop type is shared.
- Export reusable components by name.
- Keep UI components focused on rendering and local UI behavior.
- Avoid putting API calls in components such as `CustomInput` or `QuoteBlock`.
- Keep accessibility basics: label inputs, preserve focus states, and use semantic buttons/links.

## State And Side Effects

Current state management is local React state.

Rules:

- Use `useState` for simple form/page state.
- Introduce context or a state library only when multiple unrelated pages need shared state.
- Keep localStorage access limited to auth/session concerns or a dedicated helper if it grows.
- Do not add broad app state abstractions for one page.

## TypeScript Rules

- Keep props, DTOs, and API models typed.
- Avoid `any` unless bridging unknown external errors temporarily.
- Prefer explicit return types for shared helpers and services when useful.
- Use `React.ReactNode` for icon/slot props.
- Keep type exports available through `src/types/index.ts` when they are shared.
