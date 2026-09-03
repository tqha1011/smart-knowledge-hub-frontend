import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type {
  ChatMessageRequestDto,
  ChatMessageResponseDto,
  ChatSessionDetail,
  ChatSessionListData,
  CreatedChatSessionData,
} from "../types/commonType/chat";
import api from "./api";

const alias = "knowledge-spaces";
export const chatService = {
  createSession: async (knowledgeSpacePublicId: string) => {
    try {
      const response = await api.post<CreatedChatSessionData>(
        `/${alias}/${knowledgeSpacePublicId}/chat-sessions`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  deleteSession: async (
    knowledgeSpacePublicId: string,
    sessionPublicId: string,
  ) => {
    try {
      const response = await api.delete<{ success: boolean }>(
        `/${alias}/${knowledgeSpacePublicId}/chat-sessions/${sessionPublicId}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getSessions: async (
    knowledgeSpacePublicId: string,
    pageNumber?: number,
    pageSize?: number,
  ) => {
    try {
      const response = await api.get<PaginationResponse<ChatSessionListData>>(
        `/${alias}/${knowledgeSpacePublicId}/chat-sessions`,
        { params: { pageNumber, pageSize } },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getSessionDetail: async (
    knowledgeSpacePublicId: string,
    sessionPublicId: string,
    pageNumber?: number,
    pageSize?: number,
  ) => {
    try {
      const response = await api.get<ChatSessionDetail>(
        `/${alias}/${knowledgeSpacePublicId}/chat-sessions/${sessionPublicId}`,
        { params: { pageNumber, pageSize } },
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  sendMessage: async (request: ChatMessageRequestDto) => {
    try {
      const response = await api.post<ChatMessageResponseDto>(
        `/chat-messages`,
        request,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
