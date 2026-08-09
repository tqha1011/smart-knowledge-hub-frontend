import type { CurrentUser, Space } from "../../types";

// MOCK: stand-in for `GET /spaces` (the Spaces the current user can access).
export const mockSpaces: Space[] = [
  { id: "engineering", name: "Engineering", colorDot: "#0E8F82" },
  { id: "hr", name: "HR", colorDot: "#B8860B" },
  { id: "sales", name: "Sales", colorDot: "#6E6A5F" },
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
