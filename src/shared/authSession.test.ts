import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getDemoSession,
  setDemoSession,
  setSession,
  updateDemoSession,
} from "./authSession";
const demo = {
  accessToken: "guest",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  knowledgeSpacePublicId: "space",
  remainingQuestions: 20,
  sampleQuestions: ["Example?"],
};
describe("separate demo authentication", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  it("uses tab storage without a refresh token and clears staff credentials", () => {
    setSession("staff", "refresh");
    setDemoSession(demo);
    expect(getAccessToken()).toBe("guest");
    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(getDemoSession()?.remainingQuestions).toBe(20);
  });
  it("restores normal login without a leftover demo", () => {
    setDemoSession(demo);
    setSession("staff", "refresh");
    expect(getDemoSession()).toBeNull();
    expect(getAccessToken()).toBe("staff");
    expect(getRefreshToken()).toBe("refresh");
  });
  it("does not reuse an expired token", () => {
    setDemoSession({ ...demo, expiresAt: new Date(0).toISOString() });
    expect(getAccessToken()).toBeNull();
  });
  it("ignores a quota response from a previous identity", () => {
    setDemoSession(demo);
    updateDemoSession({ ...demo, remainingQuestions: 0 }, "old-token");
    expect(getDemoSession()?.remainingQuestions).toBe(20);
  });
  it("clears both session modes", () => {
    setDemoSession(demo);
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getDemoSession()).toBeNull();
  });
});
