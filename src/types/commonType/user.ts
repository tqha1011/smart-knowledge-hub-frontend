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

/** Raw `GET /users/me` response shape. `role` is a legacy/global-looking
 * field the endpoint still returns, but per the (Space, role) permission
 * model `isAdmin` is the only field that should gate anything global. */
export interface CurrentUserDto {
  publicId: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: string;
  avatarInitials: string;
  isAdmin: boolean;
}
