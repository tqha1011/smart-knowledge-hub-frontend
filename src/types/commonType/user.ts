import type { SpaceMembership } from "./space";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  /** The only true global role — a system-wide flag, not tied to any Space. */
  isAdmin: boolean;
  memberships: SpaceMembership[];
}
