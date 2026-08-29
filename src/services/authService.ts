import type { LoginDto } from "../types";
import { handleApiError } from "../shared/handleApiError";
import api from "./api";

export interface LoginResult {
  accessToken: string;
}

export const authService = {
  login: async (credentials: LoginDto) => {
    try {
      const response = await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
