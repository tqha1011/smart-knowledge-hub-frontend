import api from "./api";
import type {
  DemoConfig,
  DemoSession,
  DemoStatus,
} from "../types/authType/demo";
import { getDemoSession, updateDemoSession } from "../shared/authSession";
import { handleApiError } from "../shared/handleApiError";
export const demoService = {
  async config(signal?: AbortSignal) {
    try {
      return (
        await api.get<DemoConfig>("/auth/demo-config", {
          timeout: 120000,
          signal,
        })
      ).data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  async start() {
    try {
      return (
        await api.post<Omit<DemoSession, "sampleQuestions">>(
          "/auth/demo-session",
          undefined,
          { timeout: 120000 },
        )
      ).data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  async syncStatus() {
    const current = getDemoSession();
    if (!current) return;
    try {
      const { data } = await api.get<DemoStatus>("/auth/demo-session");
      updateDemoSession(data, current.accessToken);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  async revoke() {
    try {
      await api.delete("/auth/demo-session");
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
