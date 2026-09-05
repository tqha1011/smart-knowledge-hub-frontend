import type {
  ChangePasswordDto,
  CreateUserDto,
  InviteContextDto,
  LoginDto,
  RefreshTokenRequestDto,
  RegisterDto,
  ResetPasswordDto,
  SendOtpDto,
  SetPasswordDto,
  VerifyOtpDto,
  VerifyOtpResult,
} from "../types";
import { handleApiError } from "../shared/handleApiError";
import api from "./api";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface MessageResult {
  message: string;
}

export interface CreateUserResult {
  publicId: string;
}

export const authService = {
  login: async (credentials: LoginDto) => {
    try {
      const response = await api.post<LoginResult>("/auth/login", {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  refresh: async (refreshToken: string) => {
    try {
      const response = await api.post<RefreshTokenResult>("/auth/refresh", {
        refreshToken,
      } satisfies RefreshTokenRequestDto);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async (refreshToken: string) => {
    try {
      const response = await api.post<MessageResult>("/auth/logout", {
        refreshToken,
      } satisfies RefreshTokenRequestDto);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  register: async (data: RegisterDto) => {
    try {
      const response = await api.post<MessageResult>("/auth/register", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  createUser: async (data: CreateUserDto) => {
    try {
      const response = await api.post<CreateUserResult>("/auth/users", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  changePassword: async (data: ChangePasswordDto) => {
    try {
      const response = await api.patch<MessageResult>("/auth/password", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  sendOtp: async (data: SendOtpDto) => {
    try {
      const response = await api.post<MessageResult>("/auth/otp/send", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  verifyOtp: async (data: VerifyOtpDto) => {
    try {
      const response = await api.post<VerifyOtpResult>(
        "/auth/otp/verify",
        data,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  resetPassword: async (data: ResetPasswordDto) => {
    try {
      const response = await api.post<MessageResult>(
        "/auth/password/recovery",
        data,
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  setPassword: async (data: SetPasswordDto) => {
    try {
      const response = await api.patch<MessageResult>("/auth/password", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// MOCK: stands in for `GET /invites/:token` — not part of the auth API
// table this service otherwise implements; no backend contract yet.
export async function resolveInvite(
  token: string | null,
): Promise<InviteContextDto> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!token) {
    throw new Error("This invite link is missing a token.");
  }
  return {
    email: "invited.person@example.com",
    spaceName: "Engineering",
    role: "Editor",
  };
}

// MOCK: stands in for the invite-acceptance endpoint that finalizes a
// provisioned account's password — not part of the auth API table this
// service otherwise implements; no backend contract yet.
export async function setPassword(data: SetPasswordDto): Promise<void> {
  void data;
  await new Promise((resolve) => setTimeout(resolve, 300));
}
