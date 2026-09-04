import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type {
  ResolveUnansweredQuestionRequest,
  UnansweredQuestionData,
} from "../types/commonType/unansweredQuestion";
import api from "./api";

const firstAlias = "knowledge-spaces";
const secondAlias = "unanswered-questions";
export const unansweredQuestionService = {
  getUnansweredQuestions: async (
    spacePublicId: string,
    pageNumber?: number,
    pageSize?: number,
  ) => {
    try {
      const response = await api.get<
        PaginationResponse<UnansweredQuestionData>
      >(`/${firstAlias}/${spacePublicId}/${secondAlias}`, {
        params: {
          pageNumber,
          pageSize,
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markResolve: async (
    spacePublicId: string,
    questionPublicId: string,
    request: ResolveUnansweredQuestionRequest,
  ) => {
    try {
      const response = await api.patch(
        `/${firstAlias}/${spacePublicId}/${secondAlias}/${questionPublicId}`,
        request,
      ); // return 200Ok { resolved: true }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
