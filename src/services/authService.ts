import type { InviteContextDto, LoginDto, SetPasswordDto } from "../types";

export interface LoginResult {
  accessToken: string;
}

// MOCK: stands in for `POST /auth/login` — no backend to check credentials
// against yet, so any non-empty email/password succeeds.
export async function login(credentials: LoginDto): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (!credentials.email.trim() || !credentials.password) {
    throw new Error("Incorrect email or password. Try again.");
  }
  return { accessToken: "mock-access-token" };
}

// MOCK: stands in for `GET /invites/:token` — normally resolves who's being
// invited, to which Space, and with what role from the invite token itself.
export async function resolveInvite(
  token: string | null,
): Promise<InviteContextDto> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!token) {
    throw new Error("This invite link is invalid or has expired.");
  }
  return {
    email: "new.hire@company.com",
    spaceName: "Engineering",
    role: "Editor",
  };
}

// MOCK: stands in for `POST /auth/set-password`.
export async function setPassword({ password }: SetPasswordDto): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}
