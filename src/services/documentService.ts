import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type { DocumentListItemDto } from "../types/documentType";
import api from "./api";

const firstAlias = "knowledge-spaces";
const afterAlias = "documents";
export const documentService = {
  getListDocuments: async (spacePublicId: string) => {
    try {
      const response = await api.get<PaginationResponse<DocumentListItemDto>>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
