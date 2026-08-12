import type {
  CreateSpaceDto,
  CreateSpaceTypeDto,
  Space,
  SpaceType,
} from "../types";
import {
  mockCurrentUser,
  mockSpaceTypes,
  spaceColorPalette,
} from "../components/shell/shellMockData";

// MOCK: in-memory stand-in for a `space_types` table — persists for the
// session (not across reloads) the same way `mockCurrentUser` does.
let spaceTypesStore: SpaceType[] = [...mockSpaceTypes];
let nextColorIndex = 0;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateId(name: string): string {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

// MOCK: stands in for `GET /space-types`.
export async function listSpaceTypes(): Promise<SpaceType[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return spaceTypesStore;
}

// MOCK: stands in for `POST /space-types`.
export async function createSpaceType({
  name,
}: CreateSpaceTypeDto): Promise<SpaceType> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Type name is required.");
  }
  const newType: SpaceType = { id: generateId(trimmedName), name: trimmedName };
  spaceTypesStore = [...spaceTypesStore, newType];
  return newType;
}

// MOCK: stands in for `POST /spaces`. Also grants the creating Admin an
// Editor membership so the new Space is immediately reachable — real
// membership provisioning belongs in Users & Roles, not this form.
export async function createSpace({
  name,
  description,
  typeId,
}: CreateSpaceDto): Promise<Space> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Space name is required.");
  }
  const type = spaceTypesStore.find((item) => item.id === typeId);
  if (!type) {
    throw new Error("Choose a space type.");
  }

  const newSpace: Space = {
    id: generateId(trimmedName),
    name: trimmedName,
    description: description?.trim() || undefined,
    type,
    colorDot: spaceColorPalette[nextColorIndex % spaceColorPalette.length],
  };
  nextColorIndex += 1;

  mockCurrentUser.memberships = [
    ...mockCurrentUser.memberships,
    { space: newSpace, role: "Editor" },
  ];

  return newSpace;
}
