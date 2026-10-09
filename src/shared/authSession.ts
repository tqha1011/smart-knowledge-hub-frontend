import type { DemoSession, DemoStatus } from "../types/authType/demo";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const DEMO_KEY = "demoSession";
let sessionGeneration = 0;
// Stable across quota updates; changes when credentials or identity change.
export function getSessionVersion(): string {
  return JSON.stringify([
    sessionGeneration,
    getDemoSession()?.accessToken ?? null,
    localStorage.getItem(ACCESS_TOKEN_KEY),
    localStorage.getItem(REFRESH_TOKEN_KEY),
  ]);
}
export const DEMO_CHANGED_EVENT = "demo-session-change";
function notify() {
  window.dispatchEvent(new Event(DEMO_CHANGED_EVENT));
}
export function getDemoSession(): DemoSession | null {
  const raw = sessionStorage.getItem(DEMO_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as DemoSession;
    if (
      typeof data.accessToken !== "string" ||
      !Number.isFinite(Date.parse(data.expiresAt)) ||
      typeof data.knowledgeSpacePublicId !== "string" ||
      !Number.isInteger(data.remainingQuestions)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export function isDemoSession(): boolean {
  return getDemoSession() !== null;
}
export function getAccessToken(): string | null {
  const demo = getDemoSession();
  if (demo)
    return Date.parse(demo.expiresAt) > Date.now() ? demo.accessToken : null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
export function getRefreshToken(): string | null {
  return isDemoSession() ? null : localStorage.getItem(REFRESH_TOKEN_KEY);
}
export function setSession(accessToken: string, refreshToken: string): void {
  sessionGeneration++;
  sessionStorage.removeItem(DEMO_KEY);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  notify();
}
export function setDemoSession(session: DemoSession): void {
  sessionGeneration++;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.setItem(DEMO_KEY, JSON.stringify(session));
  notify();
}
export function updateDemoSession(
  status: DemoStatus,
  expectedToken: string,
): void {
  const current = getDemoSession();
  if (current?.accessToken !== expectedToken) return;
  sessionStorage.setItem(DEMO_KEY, JSON.stringify({ ...current, ...status }));
  notify();
}
export function clearSession(): void {
  sessionGeneration++;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(DEMO_KEY);
  notify();
}
