import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AskAiPanelBody } from "./AskAiPanelBody";
it("samples only fill the input and exhausted quota locks sending, preserving history", () => {
  const change = vi.fn();
  const send = vi.fn();
  const history = vi.fn();
  render(
    <AskAiPanelBody
      sendingBlocked
      sampleQuestions={["Timeout Mây Trắng?"]}
      demoNotice="Hết lượt; vẫn xem tài liệu được."
      viewMode="conversation"
      messages={[]}
      inputValue=""
      isSending={false}
      isLoadingSession={false}
      sessions={[]}
      isLoadingSessions={false}
      sessionsLoaded
      sessionsError={null}
      sessionError={null}
      onRetrySessions={vi.fn()}
      onRetrySession={vi.fn()}
      onInputChange={change}
      onSend={send}
      onFeedback={vi.fn()}
      onClose={vi.fn()}
      onOpenHistory={history}
      onNewChat={vi.fn()}
      onSelectSession={vi.fn()}
      onDeleteSession={vi.fn()}
      spaceName="Test RAG"
      prefersReducedMotion
    />,
  );
  expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Question" })).toBeDisabled();
  expect(screen.getByText("Hết lượt; vẫn xem tài liệu được.")).toBeVisible();
  expect(send).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /history/i }));
  expect(history).toHaveBeenCalledOnce();
});
