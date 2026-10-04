import axios from "axios";
import { handleApiError } from "../shared/handleApiError";
import type {
  PaginationResponse,
  SearchPaginationResponse,
} from "../types/commonType/pagination";
import type {
  DocumentListItemDto,
  DocumentDetailsDto,
  DocumentUploadUrlRequest,
  DocumentUploadUrlResponse,
  DocumentDownloadUrlResponse,
  DocumentDownloadDisposition,
  DocumentCreateRequest,
  DocumentPermissionRequest,
  DocumentPermissionRequestBody,
  DocumentUpdateInput,
  TrashDocumentsResponse,
  RestoredDocumentDto,
} from "../types/commonType/document";

import api from "./api";

const firstAlias = "knowledge-spaces";
const afterAlias = "documents";
export const documentService = {
  deleteDocument: async (
    spacePublicId: string,
    documentPublicId: string,
  ): Promise<void> => {
    try {
      await api.delete(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}`,
      );
    } catch (error) {
      throw handleApiError(error);
    }
  },

  restoreDocument: async (
    spacePublicId: string,
    documentPublicId: string,
  ): Promise<RestoredDocumentDto> => {
    try {
      const response = await api.post<RestoredDocumentDto>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}/restore`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getTrashDocuments: async (
    spacePublicId: string,
    pageNumber = 1,
    pageSize = 20,
  ): Promise<TrashDocumentsResponse> => {
    try {
      const response = await api.get<TrashDocumentsResponse>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/trash`,
        { params: { pageNumber, pageSize } },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  searchDocumentsForUser: async (
    spacePublicId: string,
    documentName: string,
    pageNumber = 1,
    pageSize = 20,
  ) => {
    try {
      const response = await api.get<
        SearchPaginationResponse<DocumentListItemDto>
      >(`${firstAlias}/${spacePublicId}/${afterAlias}/search`, {
        params: { documentName: documentName.trim(), pageNumber, pageSize },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getListDocumentsForUser: async (
    spacePublicId: string,
    pageNumber?: number,
    pageSize?: number,
  ) => {
    try {
      const response = await api.get<PaginationResponse<DocumentListItemDto>>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
        { params: { pageNumber, pageSize } },
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

  getUploadUrl: async (
    spacePublicId: string,
    request: DocumentUploadUrlRequest,
  ) => {
    try {
      const response = await api.post<DocumentUploadUrlResponse>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/upload-url`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getDownloadUrl: async (
    documentPublicId: string,
    spacePublicId: string,
    disposition: DocumentDownloadDisposition,
  ) => {
    try {
      const response = await api.get<DocumentDownloadUrlResponse>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}/download-url`,
        { params: { disposition } },
      );
      return response.data.downloadUrl;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createDocument: async (
    spacePublicId: string,
    request: DocumentCreateRequest,
  ) => {
    try {
      const response = await api.post<DocumentListItemDto>(
        `${firstAlias}/${spacePublicId}/${afterAlias}`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateDocument: async (
    spacePublicId: string,
    documentPublicId: string,
    request: DocumentUpdateInput,
  ) => {
    try {
      const response = await api.patch<DocumentListItemDto>(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  grantDocumentPermissions: async (
    spacePublicId: string,
    documentPublicId: string,
    request: DocumentPermissionRequest[],
  ) => {
    try {
      const body: DocumentPermissionRequestBody = { permissions: request };
      const response = await api.post(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}/permissions`,
        body,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateDocumentPermission: async (
    spacePublicId: string,
    documentPublicId: string,
    request: DocumentPermissionRequest[],
  ) => {
    try {
      const body: DocumentPermissionRequestBody = { permissions: request };
      const response = await api.patch(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}/permissions`,
        body,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Presigned storage URL (from getUploadUrl) — uploaded via a bare axios
  // call, not the shared `api` instance, since it's not our backend: it
  // must not carry the Authorization header or `api`'s default
  // Content-Type: application/json.
  uploadFileToStorage: async (
    uploadUrl: string,
    file: File | Blob,
    contentType: string,
  ) => {
    try {
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": contentType },
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  retryIngestionDocument: async (
    spacePublicId: string,
    documentPublicId: string,
  ) => {
    try {
      const response = await api.post(
        `${firstAlias}/${spacePublicId}/${afterAlias}/${documentPublicId}/retry`,
        {},
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
