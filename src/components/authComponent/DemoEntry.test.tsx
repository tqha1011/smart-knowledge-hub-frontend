import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DemoEntry } from "./DemoEntry";
import { demoService } from "../../services/demoService";
import { getDemoSession } from "../../shared/authSession";
vi.mock("../../services/demoService", () => ({
  demoService: { config: vi.fn(), start: vi.fn() },
}));
vi.mock("../../services/realtimeService", () => ({
  disconnectRealtime: vi.fn(),
}));
const config = {
  enabled: true,
  durationSeconds: 3600,
  questionLimit: 20,
  sampleQuestions: ["Example?"],
};
function show() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<DemoEntry />} />
        <Route path="/spaces/space" element={<p>Demo space opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
describe("recruiter entry", () => {
  it("opens the demo without asking for email or password", async () => {
    vi.mocked(demoService.config).mockResolvedValue(config);
    vi.mocked(demoService.start).mockResolvedValue({
      accessToken: "guest",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      knowledgeSpacePublicId: "space",
      remainingQuestions: 20,
    });
    show();
    fireEvent.click(
      await screen.findByRole("button", { name: "Vào bản demo" }),
    );
    await screen.findByText("Demo space opened");
    expect(getDemoSession()?.sampleQuestions).toEqual(["Example?"]);
    expect(demoService.start).toHaveBeenCalledTimes(1);
  });
  it("does not offer a disabled demo", async () => {
    vi.mocked(demoService.config).mockResolvedValue({
      ...config,
      enabled: false,
    });
    show();
    await waitFor(() =>
      expect(screen.queryByText("Khám phá bản demo")).not.toBeInTheDocument(),
    );
  });
  it("explains cold start and never retries a POST automatically", async () => {
    vi.useFakeTimers();
    vi.mocked(demoService.config).mockImplementation(
      () => new Promise(() => {}),
    );
    show();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang khởi động bản demo",
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(demoService.start).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
  it("offers an explicit retry when availability cannot be loaded", async () => {
    vi.mocked(demoService.config).mockRejectedValue({
      statusCode: 503,
      message: "Unavailable",
    });
    show();
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Thử tải bản demo lại" }),
    ).toBeEnabled();
  });
});
