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
  spaceCount: number;
  /** Space ids the current user has access to — passed to findAnswer so citations never leak a document from a Space the user can't see. */
  accessibleSpaceIds: string[];
  /** Used only in the low-confidence answer's copy ("logged to {space}'s Needs attention queue"). */
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
  spaceCount,
  accessibleSpaceIds,
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

    const answer = findAnswer(question, accessibleSpaceIds, selectedSpaceName);
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
          spaceCount={spaceCount}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}
