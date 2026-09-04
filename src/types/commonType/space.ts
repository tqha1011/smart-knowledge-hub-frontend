// Editor/Employee only exist as a per-Space assignment — there is no global
// "Editor" or "Employee" role outside the context of a specific Space.
export type SpaceRole = "Owner" | "Editor" | "Viewer";

// Classifies what kind of Space this is (e.g. Department, Project). Admins
// can add new types inline from the Create Space panel.
export interface SpaceType {
  publicId: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  /** Not returned by the Space list/detail endpoints — only set from mock data today. */
  type?: SpaceType;
  /** Identity dot color shown next to the Space name in the switcher and chips. */
  colorDot: string;
}

export interface SpaceMembership {
  space: Space;
  role: SpaceRole;
}

export interface RequestSpaceDto {
  name: string;
  description?: string | null;
  typePublicId: string;
}

export interface CreateSpaceTypeDto {
  name: string;
}

export interface SpaceListItemDto {
  publicId: string;
  name: string;
  totalDocuments: number;
  typeName: string;
  role: SpaceRole;
}

export interface UserDataSpaceDto {
  publicId: string;
  email: string;
  name: string;
  role: SpaceRole;
  joinedAt: Date;
}

export interface SpaceMember {
  publicId: string;
  role: SpaceRole;
}

export interface AddMemberRequest {
  members: SpaceMember[];
}

export interface KickMemberRequest {
  userPublicIds: string[];
}

export interface UpdateRoleRequest {
  role: SpaceRole;
}
