import { handleApiError } from "../shared/handleApiError";
import type { CurrentUser, CurrentUserDto } from "../types";
import api from "./api";

// Maps the raw `GET /users/me` response onto the UI-facing `CurrentUser`
// shape — `memberships` isn't part of this endpoint, callers that need the
// Space list attach it separately from `knowledgeSpaceService.getUserSpaces`.
export function toCurrentUser(dto: CurrentUserDto): CurrentUser {
  return {
    id: dto.publicId,
    name: dto.username,
    email: dto.email,
    avatarInitials: dto.avatarInitials,
    isAdmin: dto.isAdmin,
    memberships: [],
  };
}

export const userService = {
  getMe: async () => {
    try {
      const response = await api.get<CurrentUserDto>("/users/me");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
