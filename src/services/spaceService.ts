import axios from "axios";
import type { ApiErrorResponse } from "../types/commonType/apiResponse";
import type { RequestSpaceDto } from "../types/commonType/space";
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
      if (axios.isAxiosError(error)) {
        // axios will return two types of errors:
        // response errors (server responded with a status code outside the 2xx range)
        // network errors (no response received)
        if (error.response) {
          const errorData = {
            statusCode: error.response.status,
            message: error.response.data.message || "An error occurred",
            error: error.response.data.error || "Bad Request",
          } as ApiErrorResponse;
          throw errorData;
        }
        // handle network error (no response)
        throw {
          statusCode: 0,
          message:
            "Network error: Unable to reach the server. Please check your internet connection.",
          error: "Network Error",
        } as ApiErrorResponse;
      }
      throw error;
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
      if (axios.isAxiosError(error)) {
        // axios will return two types of errors:
        // response errors (server responded with a status code outside the 2xx range)
        // network errors (no response received)
        if (error.response) {
          const errorData = {
            statusCode: error.response.status,
            message: error.response.data.message || "An error occurred",
            error: error.response.data.error || "Bad Request",
          } as ApiErrorResponse;
          throw errorData;
        }
        // handle network error (no response)
        throw {
          statusCode: 0,
          message:
            "Network error: Unable to reach the server. Please check your internet connection.",
          error: "Network Error",
        } as ApiErrorResponse;
      }
      throw error;
    }
  },

  getUserRole: async (spacePublicId: string) => {
    try {
      const response = await api.get(`knowledge-spaces/${spacePublicId}/role`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // axios will return two types of errors:
        // response errors (server responded with a status code outside the 2xx range)
        // network errors (no response received)
        if (error.response) {
          const errorData = {
            statusCode: error.response.status,
            message: error.response.data.message || "An error occurred",
            error: error.response.data.error || "Bad Request",
          } as ApiErrorResponse;
          throw errorData;
        }
        // handle network error (no response)
        throw {
          statusCode: 0,
          message:
            "Network error: Unable to reach the server. Please check your internet connection.",
          error: "Network Error",
        } as ApiErrorResponse;
      }
      throw error;
    }
  },
};
