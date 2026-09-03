import { handleApiError } from "../shared/handleApiError";
import type { PaginationResponse } from "../types/commonType/pagination";
import type { UnansweredQuestionData } from "../types/commonType/unansweredQuestion";
import api from "./api";

const firstAlias = "knowledge-spaces";
const secondAlias = "unanswered-questions";
export const unansweredQuestionService = {
  getUnansweredQuestions: async (spacePublicId: string) => {
    try {
      const response = await api.get<
        PaginationResponse<UnansweredQuestionData>
      >(`/${firstAlias}/${spacePublicId}/${secondAlias}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  markResolve: async (spacePublicId: string, questionPublicId: string) => {
    try {
      const response = await api.patch(
        `/${firstAlias}/${spacePublicId}/${secondAlias}/${questionPublicId}`,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
