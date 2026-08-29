import { handleApiError } from "../shared/handleApiError";
import type {
  CreateSpaceTypeDto,
  RequestSpaceDto,
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
      const response = await api.get(`/${alias}/${spacePublicId}/role`);
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
      const response = await api.get(`/${alias}/types`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
