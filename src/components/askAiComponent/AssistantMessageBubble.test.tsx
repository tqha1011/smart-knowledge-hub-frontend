import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
it("opens the cited document by its public ID", () => {
  const open = vi.fn();
  render(
    <AssistantMessageBubble
      message={{
        id: "reply",
        role: "assistant",
        answer: {
          text: "Timeout is 740 ms",
          citations: [
            {
              chipNumber: 1,
              documentId: "doc-1",
              documentTitle: "Mây Trắng — Giới hạn thời gian API.md",
              excerpt: "Timeout API là 740 ms",
            },
          ],
        },
        feedback: null,
      }}
      onFeedback={vi.fn()}
      onOpenDocument={open}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Mây Trắng — Giới hạn thời gian API.md",
    }),
  );
  expect(open).toHaveBeenCalledWith("doc-1");
});
