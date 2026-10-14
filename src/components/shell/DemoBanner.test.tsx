import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { DemoBanner } from "./DemoBanner";
import { demoService } from "../../services/demoService";
import { setDemoSession } from "../../shared/authSession";
vi.mock("../../services/demoService", () => ({
  demoService: {
    syncStatus: vi.fn().mockResolvedValue(undefined),
    revoke: vi.fn(),
  },
}));
afterEach(() => vi.useRealTimers());
it("refreshes an exhausted daily budget at its UTC reset without reloading", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T23:59:50Z"));
  setDemoSession({
    accessToken: "guest",
    knowledgeSpacePublicId: "space",
    expiresAt: "2026-10-10T00:59:50Z",
    remainingQuestions: 10,
    dailyQuestionBudgetExhausted: true,
    resetAt: "2026-10-10T00:00:00Z",
    sampleQuestions: [],
  });
  render(
    <MemoryRouter>
      <DemoBanner />
    </MemoryRouter>,
  );
  await act(async () => {});
  expect(demoService.syncStatus).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10050);
  });
  expect(demoService.syncStatus).toHaveBeenCalledTimes(2);
});
