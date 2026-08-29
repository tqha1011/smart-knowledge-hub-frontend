import type { RequestSpaceDto } from "../types/commonType/space";
import { handleApiError } from "../shared/handleApiError";
import api from "./api";

export const knowledgeSpaceService = {
  createSpace: async (newSpace: RequestSpaceDto) => {
    try {
      const response = await api.post("/knowledge-spaces", {
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
      const response = await api.put(`/knowledge-spaces/${publicId}`, {
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
      const response = await api.get(`knowledge-spaces/${spacePublicId}/role`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
