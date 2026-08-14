import type { SpaceMembership, SpaceRole } from "./space";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  /** The only true global role — a system-wide flag, not tied to any Space. */
  isAdmin: boolean;
  memberships: SpaceMembership[];
}

export type UserStatus = "active" | "invited";

// A row in the Users & Roles admin list — org-wide, not Space-scoped.
// Distinct from CurrentUser (the logged-in session's own identity) even
// though the shapes overlap; mockOrgUsers derives the current user's own
// row from mockCurrentUser's fields rather than duplicating them (see
// shellMockData.ts), but editing that row here does not live-update the
// session's own mockCurrentUser — same "mock, no real backend" limitation
// as the rest of this app's admin actions.
export interface OrgUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  isAdmin: boolean;
  status: UserStatus;
  memberships: SpaceMembership[];
}

// Payload submitted by the User detail panel's Save action.
export interface UserAccessUpdate {
  isAdmin: boolean;
  memberships: SpaceMembership[];
}

// One person-card's worth of input from the Invite panel — exactly one
// Space + one role per invitee, per spec (no per-person repeat-add; only
// the panel-level "+ Add another person" repeats).
export interface InviteCandidate {
  email: string;
  spaceId: string;
  role: SpaceRole;
}
