import type { PaginationResponse } from "./pagination";

export type ChatMessageRole = "User" | "Assistant";

export interface CreatedChatSessionData {
  publicId: string;
  title: string;
}

export interface ChatSessionListData {
  publicId: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessageListData {
  publicId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface ChatSessionDetail {
  publicId: string;
  title: string;
  createdAt: string;
  messages: PaginationResponse<ChatMessageListData>;
}

export interface ChatSource {
  documentPublicId: string;
  documentTitle: string;
  excerpt: string;
  score: number;
}

export interface ChatMessageRequestDto {
  knowledgeSpacePublicId: string;
  chatSessionPublicId: string;
  content: string;
}

export interface ChatMessageResponseDto {
  messagePublicId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  sources: ChatSource[];
}
