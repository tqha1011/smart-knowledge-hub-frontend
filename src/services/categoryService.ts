import { handleApiError } from "../shared/handleApiError";
import type {
  CategoryDto,
  CreateCategoryRequest,
} from "../types/commonType/category";
import api from "./api";

const firstAlias = "knowledge-spaces";
const afterAlias = "categories";
export const categoryService = {
  createCategory: async (
    spacePublicId: string,
    request: CreateCategoryRequest,
  ) => {
    try {
      const response = await api.post<CategoryDto>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getListCategory: async (spacePublicId: string) => {
    try {
      const response = await api.get<CategoryDto[]>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
