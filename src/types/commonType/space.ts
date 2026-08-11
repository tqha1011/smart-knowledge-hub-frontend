// Editor/Employee only exist as a per-Space assignment — there is no global
// "Editor" or "Employee" role outside the context of a specific Space.
export type SpaceRole = "Editor" | "Employee";

// Classifies what kind of Space this is (e.g. Department, Project). Admins
// can add new types inline from the Create Space panel.
export interface SpaceType {
  id: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  type: SpaceType;
  /** Identity dot color shown next to the Space name in the switcher and chips. */
  colorDot: string;
}

export interface SpaceMembership {
  space: Space;
  role: SpaceRole;
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
  typeId: string;
}

export interface CreateSpaceTypeDto {
  name: string;
}
