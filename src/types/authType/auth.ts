import type { SpaceRole } from "../commonType/space";

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface SetPasswordDto {
  password: string;
}

export interface InviteContextDto {
  email: string;
  spaceName: string;
  role: SpaceRole;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  role?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface SendOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface VerifyOtpResult {
  message: string;
  resetToken: string;
}

export interface ResetPasswordDto {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface SetPasswordDto {
  oldPassword: string;
  newPassword: string;
}
