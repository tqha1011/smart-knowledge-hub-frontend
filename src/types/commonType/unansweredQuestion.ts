export interface UnansweredQuestionData {
  publicId: string;
  question: string;
  reason: string;
}

export interface ResolveUnansweredQuestionRequest {
  answer: string;
}
