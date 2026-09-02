import axios from "axios";
import type { ApiErrorResponse } from "../types/commonType/apiResponse";

// ApiErrorResponse.message can be a single string or a list of validation
// messages (e.g. class-validator style) — flatten either into one string
// for a toast.
export function toErrorMessage(error: ApiErrorResponse): string {
  return Array.isArray(error.message) ? error.message.join(" ") : error.message;
}

export function handleApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    // axios will return two types of errors:
    // response errors (server responded with a status code outside the 2xx range)
    // network errors (no response received)
    if (error.response) {
      return {
        statusCode: error.response.status,
        message: error.response.data.message || "An error occurred",
        error: error.response.data.error || "Bad Request",
      } as ApiErrorResponse;
    }
    // handle network error (no response)
    return {
      statusCode: 0,
      message:
        "Network error: Unable to reach the server. Please check your internet connection.",
      error: "Network Error",
    } as ApiErrorResponse;
  }
  throw error;
}
