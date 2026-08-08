// Editor/Employee only exist as a per-Space assignment — there is no global
// "Editor" or "Employee" role outside the context of a specific Space.
export type SpaceRole = "Editor" | "Employee";

export interface Space {
  id: string;
  name: string;
  /** Identity dot color shown next to the Space name in the switcher and chips. */
  colorDot: string;
}

export interface SpaceMembership {
  space: Space;
  role: SpaceRole;
}
