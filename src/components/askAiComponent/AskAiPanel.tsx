import { useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import type {
  AssistantChatMessage,
  ChatMessage,
  UserChatMessage,
} from "../../types";
import { findAnswer } from "./mockAiKnowledgeBase";
import { AskAiPanelBody } from "./AskAiPanelBody";

interface AskAiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** The currently selected Space — answers/citations are scoped to this Space only. */
  selectedSpaceId: string;
  selectedSpaceName: string;
  onLogKnowledgeGap: (question: string) => void;
}

// Top-level Ask AI panel. Deliberately keeps `messages`/`inputValue` state
// here, one level above the isOpen-gated AskAiPanelBody — this component
// itself stays mounted for as long as PortalShell is mounted (see
// PortalShell.tsx, where it's rendered outside the nav-key-conditional
// <main> block, same as the panel it replaces), so closing and reopening
// the panel preserves the conversation. Only a Space switch (which
// remounts PortalShell entirely) resets it — already true today for
// isAskAiOpen itself, so this isn't a new limitation.
export function AskAiPanel({
  isOpen,
  onClose,
  selectedSpaceId,
  selectedSpaceName,
  onLogKnowledgeGap,
}: AskAiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const handleSend = () => {
    const question = inputValue.trim();
    if (!question) return;

    const userMessage: UserChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      question,
    };

    const answer = findAnswer(question, selectedSpaceId, selectedSpaceName);
    const assistantMessage: AssistantChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: "assistant",
      answer,
      feedback: null,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");

    if (answer.isLowConfidence) {
      onLogKnowledgeGap(question);
    }
  };

  const handleFeedback = (
    messageId: string,
    vote: "helpful" | "not-helpful",
    comment?: string,
  ) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId && message.role === "assistant"
          ? { ...message, feedback: vote, feedbackComment: comment }
          : message,
      ),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <AskAiPanelBody
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onFeedback={handleFeedback}
          onClose={onClose}
          spaceName={selectedSpaceName}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}
