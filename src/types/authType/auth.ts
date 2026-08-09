import type { SpaceRole } from "../commonType/space";

export interface LoginDto {
  email: string;
  password: string;
}

export interface SetPasswordDto {
  password: string;
}

export interface InviteContextDto {
  email: string;
  spaceName: string;
  role: SpaceRole;
}
