import axios from "axios";
import type { LoginDto } from "../types";
import type { ApiErrorResponse } from "../types/commonType/apiResponse";
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
