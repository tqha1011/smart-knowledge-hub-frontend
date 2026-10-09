import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it } from "vitest";
import App from "../App";
import { getDemoSession } from "../shared/authSession";
// Opt-in only: a live local API with Test RAG, Redis and real AI is required.
it.skipIf(import.meta.env.VITE_DEMO_LIVE_TEST !== "true")(
  "enters demo, asks once, opens its source and exits through the actual app",
  async () => {
    window.history.replaceState({}, "", "/login");
    render(<App />);
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Vào bản demo" },
        { timeout: 120000 },
      ),
    );
    const chat = await screen.findByRole(
      "dialog",
      { name: "Ask AI" },
      { timeout: 15000 },
    );
    const sample = within(chat).getByRole("button", {
      name: /Theo tài liệu.*Giới hạn thời gian API/,
    });
    fireEvent.click(sample);
    expect(within(chat).getByRole("textbox", { name: "Question" })).toHaveValue(
      sample.textContent,
    );
    fireEvent.click(within(chat).getByRole("button", { name: "Send" }));
    const source = await within(chat).findByRole(
      "button",
      { name: "Mây Trắng — Giới hạn thời gian API.md" },
      { timeout: 120000 },
    );
    await waitFor(() => expect(getDemoSession()?.remainingQuestions).toBe(19));
    fireEvent.click(source);
    const doc = await screen.findByRole(
      "dialog",
      { name: /Mây Trắng — Giới hạn thời gian API.md details/ },
      { timeout: 15000 },
    );
    expect(within(doc).getAllByText(/740/).length).toBeGreaterThan(0);
    expect(
      within(doc).queryByRole("button", { name: /edit details/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(doc).getByRole("button", { name: "Close document details" }),
    );
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    window.dispatchEvent(new Event("resize"));
    fireEvent.click(screen.getByRole("button", { name: "Thoát demo" }));
    await screen.findByRole(
      "button",
      { name: "Vào bản demo" },
      { timeout: 15000 },
    );
    expect(getDemoSession()).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
  },
  150000,
);
