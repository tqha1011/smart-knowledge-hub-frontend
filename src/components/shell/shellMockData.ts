import type { CurrentUser, Space, SpaceType } from "../../types";

// MOCK: stand-in for `GET /space-types`.
export const mockSpaceTypes: SpaceType[] = [
  { id: "department", name: "Department" },
  { id: "project", name: "Project" },
  { id: "practice-area", name: "Practice area" },
];

// Cycled through for Spaces created without an explicit color — pulled from
// the app's own token palette so new dots never clash with it.
export const spaceColorPalette = [
  "#0E8F82",
  "#B8860B",
  "#6E6A5F",
  "#2F7D5B",
  "#C0392B",
];

// MOCK: stand-in for `GET /spaces` (the Spaces the current user can access).
export const mockSpaces: Space[] = [
  {
    id: "engineering",
    name: "Engineering",
    type: mockSpaceTypes[0],
    colorDot: "#0E8F82",
  },
  { id: "hr", name: "HR", type: mockSpaceTypes[0], colorDot: "#B8860B" },
  {
    id: "sales",
    name: "Sales",
    type: mockSpaceTypes[0],
    colorDot: "#6E6A5F",
  },
];

// MOCK: stand-in for `GET /me` (current user + their (Space, role) pairs).
export const mockCurrentUser: CurrentUser = {
  id: "u1",
  name: "Alex Rivera",
  email: "alex@company.com",
  avatarInitials: "AR",
  isAdmin: true,
  memberships: [
    { space: mockSpaces[0], role: "Editor" },
    { space: mockSpaces[1], role: "Employee" },
    { space: mockSpaces[2], role: "Employee" },
  ],
};

// MOCK: stand-in for the selected Space's knowledge-gap queue count.
export const mockNeedsAttentionCount = 3;

// MOCK: per-space stats shown on the Spaces overview cards — stands in for
// whatever summary endpoint would back that grid.
export const mockSpaceStats: Record<
  string,
  { documentCount: number; needsAttentionCount: number }
> = {
  engineering: { documentCount: 128, needsAttentionCount: 3 },
  hr: { documentCount: 42, needsAttentionCount: 0 },
  sales: { documentCount: 76, needsAttentionCount: 1 },
};
