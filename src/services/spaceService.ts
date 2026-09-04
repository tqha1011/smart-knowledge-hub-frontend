import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type {
  AddMemberRequest,
  CreateSpaceTypeDto,
  KickMemberRequest,
  RequestSpaceDto,
  SpaceListItemDto,
  SpaceRole,
  SpaceType,
  UpdateRoleRequest,
  UserDataSpaceDto,
} from "../types/commonType/space";
import api from "./api";

const alias = "knowledge-spaces";
export const knowledgeSpaceService = {
  createSpace: async (newSpace: RequestSpaceDto) => {
    try {
      const response = await api.post(`/${alias}`, {
        name: newSpace.name,
        description: newSpace.description,
        typePublicId: newSpace.typePublicId,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateSpace: async (publicId: string, updateSpace: RequestSpaceDto) => {
    try {
      const response = await api.put(`/${alias}/${publicId}`, {
        name: updateSpace.name,
        description: updateSpace.description,
        typePublicId: updateSpace.typePublicId,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserRole: async (spacePublicId: string) => {
    try {
      const response = await api.get<SpaceRole>(
        `/${alias}/${spacePublicId}/role`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserSpaces: async (pageNumber?: number, pageSize?: number) => {
    try {
      const response = await api.get<PaginationResponse<SpaceListItemDto>>(
        `/${alias}/`,
        {
          params: {
            pageNumber,
            pageSize,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getListUser: async (
    spacePublicId: string,
    pageNumber?: number,
    pageSize?: number,
  ) => {
    try {
      const response = await api.get<PaginationResponse<UserDataSpaceDto>>(
        `/${alias}/${spacePublicId}/members`,
        {
          params: {
            pageNumber,
            pageSize,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const knowledgeSpaceTypeService = {
  createType: async (newType: CreateSpaceTypeDto) => {
    try {
      const response = await api.post(`/${alias}/types`, {
        name: newType.name,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getListTypes: async () => {
    try {
      const response = await api.get<SpaceType[]>(`/${alias}/types`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const knowledgeSpaceMemberService = {
  addMembers: async (spacePublicId: string, request: AddMemberRequest) => {
    try {
      const response = await api.post(
        `/${alias}/${spacePublicId}/members`,
        request,
      ); // return 201
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  leaveSpaces: async (spacePublicId: string) => {
    try {
      const response = await api.delete(
        `/${alias}/${spacePublicId}/members/me`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  kickMembers: async (spacePublicId: string, request: KickMemberRequest) => {
    try {
      const response = await api.delete(`/${alias}/${spacePublicId}/members/`, {
        data: request,
      }); // return 200Ok with { success: true }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateRole: async (
    spacePublicId: string,
    userPublicId: string,
    request: UpdateRoleRequest,
  ) => {
    try {
      const response = await api.put(
        `/${alias}/${spacePublicId}/members/${userPublicId}`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
