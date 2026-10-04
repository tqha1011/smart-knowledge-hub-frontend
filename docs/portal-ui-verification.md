# Knowledge Portal UI verification

The UI upgrade preserves the cream/teal palette, Fraunces/Manrope fonts, API contracts, permission checks, mutations, realtime subscriptions, route resets, and conversation persistence. The topbar shows the current Space and now includes document search. No dependencies or test framework were added.

Shared motion presets cover controls, navigation indicators, tabs, panels, backdrops, and dropdowns. Reduced motion disables transforms, springs, looping indicators, and smooth scrolling. First loads show static skeletons; failures expose inline Retry; refetches retain successful content; page changes hide previous results; obsolete responses are discarded.

## Verification

- `npm run lint`: passed without warnings.
- `npm run build`: passed. The existing warnings about the auth service's mixed imports and a bundle above 500 kB remain.
- `git diff --check`: passed.
- Chromium smoke checks: 20 passed, with simulated API responses and no uncaught page errors.

The browser checks cover tab/filter/pagination preservation, keyboard tab navigation, slow and failed detail loads, Retry, focus traps and focus return, repeated open/close, detail → edit, nested type dialogs, mobile drawer → Ask AI, initial list errors, failed refetches retaining content, competing requests, chat history, conversation persistence, Admin/Editor/Viewer permissions, empty states, long names, many filters, mobile targets, both responsive breakpoints, and reduced motion.

Upload, edit, replacement, question resolution, member creation, and role changes were exercised through the UI and their outgoing service payloads checked. A simulated Socket.IO status event refreshed both the current list and open document detail; an event from another Space was ignored. Auth received a light/dark layout smoke check at mobile and desktop widths.

Semantic text/background pairs were measured in both themes, including primary controls, citations, status badges, file types, muted text, and selected filters. All checked pairs meet 4.5:1. The light Ready text was darkened after its original pair measured 4.44:1.

## Review fixes

- Reproduced a delayed retry-processing mutation completing after page 1 → page 2 navigation. Its stale reload callback previously left page 2 loading indefinitely. Reload now targets the active resource and ignores calls after unmount; the reproduction and a competing-refetch case pass.
- Added Category to document details, and Joined plus fully wrapping name/email to member details, so hidden mobile metadata remains accessible.

## Visual evidence

[Open the before/after comparison](/tmp/portal-ui-review/index.html). It contains 64 baseline and 64 updated screenshots using the same fixture responses.

Spaces and Library were captured in light/dark at 375, 639, 640, 641, 979, 980, 981, and 1440 px. Needs attention, Members, document details, and Ask AI were captured in both themes at 375, 640, 980, and 1440 px. Representative screenshots were visually inspected, including long document titles and wrapped citation sources.

[Smoke results](/tmp/portal-ui-review/smoke.json) · [Contrast measurements](/tmp/portal-ui-review/contrast.json) · [Temporary browser harness](/tmp/portal-ui-browser.cjs)

## Document search integration

The topbar search submits on Enter or the search button. Nonempty trimmed names use `GET /knowledge-spaces/:spacePublicId/documents/search` through the shared authenticated client, with page size 20. New and repeated submissions start at page 1 and open Documents from other destinations. Clearing the field restores the ordinary list without sending an empty search request. Category filters still apply only to the returned page; document read access remains enforced by the backend.

Eight additional Chromium checks passed using mocked search responses: exact GET/query/bearer contract, search pagination and repeated submission, clearing and whitespace, navigation from Members/Needs attention, slow and obsolete responses, inline error/Retry, empty results and Viewer controls, and Space resets. Search was also captured at 375/639/640/979/980/1440 px in both themes with no horizontal overflow and mobile controls at least 44 px high. A focused independent code review found no substantive issues.

[Search check results](/tmp/portal-ui-review/search-smoke.json) · [Search browser harness](/tmp/portal-document-search.cjs)

## Limits

These checks used fixture identities, intercepted REST responses, and a simulated realtime transport. Live backend authorization, storage uploads, ingestion, AI answers, membership persistence, real realtime delivery, and real authentication were not verified. Physical-device safe-area behavior was not tested; the safe-area CSS and responsive layout were checked in Chromium. Screenshots and the harness are temporary local artifacts under `/tmp`.
