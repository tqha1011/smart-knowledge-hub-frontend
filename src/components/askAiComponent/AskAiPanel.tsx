import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "react-toastify";
import type {
  AssistantChatMessage,
  ChatMessage,
  ChatMessageListData,
  ChatMessageResponseDto,
  ChatSessionListData,
  UserChatMessage,
} from "../../types";
import { chatService } from "../../services/chatService";
import { toErrorMessage } from "../../shared/handleApiError";
import type { ApiErrorResponse } from "../../types/commonType/apiResponse";
import { AskAiPanelBody } from "./AskAiPanelBody";

interface AskAiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** The currently selected Space — answers/citations are scoped to this Space only. */
  selectedSpaceId: string;
  selectedSpaceName: string;
  onLogKnowledgeGap: (question: string) => void;
}

const MAX_MESSAGE_LENGTH = 4000;
const SESSION_LIST_PAGE_SIZE = 20;
// Title starts as "New chat" and a background job renames it shortly after
// the first message — one delayed silent refetch is enough to usually
// catch the real title without polling in a loop.
const TITLE_REFRESH_DELAY_MS = 4000;

// GET session detail (ChatMessageListData) doesn't carry `sources` — only
// the live POST /chat-messages response does. Reopening a past chat from
// history therefore shows the assistant's text without its original
// citations; a backend-shaped limitation, not something the FE can recover.
function toUiMessage(apiMessage: ChatMessageListData): ChatMessage {
  if (apiMessage.role === "User") {
    return {
      id: apiMessage.publicId,
      role: "user",
      question: apiMessage.content,
    };
  }
  return {
    id: apiMessage.publicId,
    role: "assistant",
    answer: { text: apiMessage.content, citations: [] },
    feedback: null,
  };
}

function toAssistantMessage(
  response: ChatMessageResponseDto,
): AssistantChatMessage {
  return {
    id: response.messagePublicId,
    role: "assistant",
    answer: {
      text: response.content,
      citations: response.sources.map((source, index) => ({
        chipNumber: index + 1,
        documentId: source.documentPublicId,
        documentTitle: source.documentTitle,
        excerpt: source.excerpt,
      })),
    },
    feedback: null,
  };
}

// Top-level Ask AI panel. Deliberately keeps conversation/session state
// here, one level above the isOpen-gated AskAiPanelBody — this component
// itself stays mounted for as long as PortalShell is mounted (see
// PortalShell.tsx, where it's rendered outside the nav-key-conditional
// <main> block, same as the panel it replaces), so closing and reopening
// the panel preserves the conversation. Only a Space switch (which
// remounts PortalShell entirely, per App.tsx's key={location.pathname})
// resets it.
export function AskAiPanel({
  isOpen,
  onClose,
  selectedSpaceId,
  selectedSpaceName,
  onLogKnowledgeGap,
}: AskAiPanelProps) {
  const [viewMode, setViewMode] = useState<"conversation" | "list">(
    "conversation",
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionListData[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMountedRef = useRef(true);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await chatService.getSessions(
        selectedSpaceId,
        1,
        SESSION_LIST_PAGE_SIZE,
      );
      if (isMountedRef.current) setSessions(response.items);
    } catch (error) {
      if (isMountedRef.current) {
        toast.error(toErrorMessage(error as ApiErrorResponse));
      }
    } finally {
      if (isMountedRef.current) setIsLoadingSessions(false);
    }
  };

  const handleOpenHistory = () => {
    setViewMode("list");
    loadSessions();
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setViewMode("conversation");
  };

  const handleSelectSession = async (session: ChatSessionListData) => {
    setIsLoadingSession(true);
    try {
      const detail = await chatService.getSessionDetail(
        selectedSpaceId,
        session.publicId,
      );
      if (!isMountedRef.current) return;
      setActiveSessionId(detail.publicId);
      setMessages(detail.messages.items.map(toUiMessage));
      setViewMode("conversation");
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    } finally {
      if (isMountedRef.current) setIsLoadingSession(false);
    }
  };

  const handleDeleteSession = async (session: ChatSessionListData) => {
    try {
      await chatService.deleteSession(selectedSpaceId, session.publicId);
      if (!isMountedRef.current) return;
      setSessions((prev) =>
        prev.filter((s) => s.publicId !== session.publicId),
      );
      if (activeSessionId === session.publicId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success("Chat deleted.");
    } catch (error) {
      toast.error(toErrorMessage(error as ApiErrorResponse));
    }
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isSending) return;
    if (question.length > MAX_MESSAGE_LENGTH) {
      toast.error(
        `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`,
      );
      return;
    }

    setIsSending(true);
    let sessionId = activeSessionId;
    const isNewSession = !sessionId;

    try {
      if (!sessionId) {
        const created = await chatService.createSession(selectedSpaceId);
        sessionId = created.publicId;
        if (isMountedRef.current) setActiveSessionId(sessionId);
      }

      const userMessage: UserChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        question,
      };
      if (isMountedRef.current) {
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
      }

      const response = await chatService.sendMessage({
        knowledgeSpacePublicId: selectedSpaceId,
        chatSessionPublicId: sessionId,
        content: question,
      });
      if (!isMountedRef.current) return;

      setMessages((prev) => [...prev, toAssistantMessage(response)]);

      if (response.sources.length === 0) {
        onLogKnowledgeGap(question);
      }

      if (isNewSession) {
        setTimeout(() => {
          if (isMountedRef.current) loadSessions();
        }, TITLE_REFRESH_DELAY_MS);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setMessages((prev) => prev.slice(0, -1));
        toast.error(toErrorMessage(error as ApiErrorResponse));
      }
    } finally {
      if (isMountedRef.current) setIsSending(false);
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
          viewMode={viewMode}
          messages={messages}
          inputValue={inputValue}
          isSending={isSending}
          isLoadingSession={isLoadingSession}
          sessions={sessions}
          isLoadingSessions={isLoadingSessions}
          onInputChange={setInputValue}
          onSend={handleSend}
          onFeedback={handleFeedback}
          onClose={onClose}
          onOpenHistory={handleOpenHistory}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          spaceName={selectedSpaceName}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </AnimatePresence>
  );
}
