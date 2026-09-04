import type { CurrentUser, Space, SpaceType } from "../../types";

// MOCK: stand-in for `GET /space-types`.
export const mockSpaceTypes: SpaceType[] = [
  { publicId: "department", name: "Department" },
  { publicId: "project", name: "Project" },
  { publicId: "practice-area", name: "Practice area" },
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
    { space: mockSpaces[1], role: "Viewer" },
    { space: mockSpaces[2], role: "Viewer" },
  ],
};
