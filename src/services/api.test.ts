import { afterEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import api from "./api";
import { authService } from "./authService";
import { redirectToLogin } from "../shared/navigation";
import {
  clearSession,
  getDemoSession,
  getAccessToken,
  setDemoSession,
  setSession,
} from "../shared/authSession";
vi.mock("./authService", () => ({ authService: { refresh: vi.fn() } }));
vi.mock("./realtimeService", () => ({ disconnectRealtime: vi.fn() }));
vi.mock("../shared/navigation", () => ({ redirectToLogin: vi.fn() }));
const originalAdapter = api.defaults.adapter;
const demo = {
  accessToken: "guest",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  knowledgeSpacePublicId: "space",
  remainingQuestions: 20,
  sampleQuestions: [],
};
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  vi.clearAllMocks();
});
describe("demo API authentication", () => {
  it("attaches the token to status but not public demo entry", async () => {
    setDemoSession(demo);
    const seen: (string | undefined)[] = [];
    api.defaults.adapter = async (config) => {
      seen.push(config.headers.Authorization as string | undefined);
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await api.get("/auth/demo-session");
    await api.post("/auth/demo-session");
    await api.get("/auth/demo-config");
    expect(seen).toEqual(["Bearer guest", undefined, undefined]);
  });
  it("clears expired demo without attempting a staff refresh", async () => {
    setDemoSession(demo);
    localStorage.setItem("refreshToken", "stale-staff-token");
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
        data: {},
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      });
    };
    await expect(api.get("/auth/demo-session")).rejects.toThrow("Expired");
    expect(getDemoSession()).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(authService.refresh).not.toHaveBeenCalled();
    expect(redirectToLogin).toHaveBeenCalledWith(true);
  });
  it("preserves the demo token on quota exhaustion", async () => {
    setDemoSession(demo);
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Quota", "ERR_BAD_REQUEST", config, undefined, {
        data: {},
        status: 429,
        statusText: "Too Many Requests",
        headers: {},
        config,
      });
    };
    await expect(api.post("/chat-messages", {})).rejects.toThrow("Quota");
    expect(getAccessToken()).toBe("guest");
    expect(authService.refresh).not.toHaveBeenCalled();
  });
  it("keeps refresh working for normal accounts", async () => {
    setSession("staff", "staff-refresh");
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: "new-staff",
      refreshToken: "new-refresh",
    });
    let calls = 0;
    api.defaults.adapter = async (config) => {
      if (calls++ === 0)
        throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
          data: {},
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        });
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    await api.get("/users/me");
    expect(authService.refresh).toHaveBeenCalledWith("staff-refresh");
    expect(getAccessToken()).toBe("new-staff");
    expect(getDemoSession()).toBeNull();
  });
});

for (const replacement of ["demo", "logout"] as const) {
  it(`ignores a staff refresh completing after ${replacement}`, async () => {
    setSession("staff", "staff-refresh");
    let finish!: (result: {
      accessToken: string;
      refreshToken: string;
    }) => void;
    vi.mocked(authService.refresh).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls++;
      throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
        data: {},
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      });
    };
    const pending = api.get("/users/me");
    const caught = pending.catch(() => undefined);
    await waitFor(() => expect(authService.refresh).toHaveBeenCalledOnce());
    if (replacement === "demo") setDemoSession(demo);
    else clearSession();
    finish({ accessToken: "new-staff", refreshToken: "new-refresh" });
    await caught;
    expect(getAccessToken()).toBe(replacement === "demo" ? "guest" : null);
    expect(calls).toBe(1);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
}
it("does not let a late old guest 401 clear a newer session", async () => {
  setDemoSession(demo);
  let fail!: () => void;
  api.defaults.adapter = (config) =>
    new Promise((_resolve, reject) => {
      fail = () =>
        reject(
          new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
            data: {},
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config,
          }),
        );
    });
  const pending = api.get("/auth/demo-session");
  const caught = pending.catch(() => undefined);
  await waitFor(() => expect(fail).toBeTypeOf("function"));
  setSession("admin-new", "admin-refresh");
  fail();
  await caught;
  expect(getAccessToken()).toBe("admin-new");
  expect(authService.refresh).not.toHaveBeenCalled();
  expect(redirectToLogin).not.toHaveBeenCalled();
});
