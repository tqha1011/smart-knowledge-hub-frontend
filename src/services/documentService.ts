import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type {
  DocumentListItemDto,
  DocumentDetailsDto,
} from "../types/commonType/document";

import api from "./api";

const firstAlias = "knowledge-spaces";
const afterAlias = "documents";
export const documentService = {
  getListDocumentsForUser: async (spacePublicId: string) => {
    try {
      const response = await api.get<PaginationResponse<DocumentListItemDto>>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getDocumentDetails: async (
    documentPublicId: string,
    spacePublicId: string,
  ) => {
    try {
      const response = await api.get<DocumentDetailsDto>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
