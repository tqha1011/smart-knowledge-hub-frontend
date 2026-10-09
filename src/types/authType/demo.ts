export interface DemoConfig {
  enabled: boolean;
  durationSeconds: number;
  questionLimit: number;
  sampleQuestions: string[];
}
export interface DemoStatus {
  expiresAt: string;
  knowledgeSpacePublicId: string;
  remainingQuestions: number;
  dailyQuestionBudgetExhausted?: boolean;
  resetAt?: string;
}
export interface DemoSession extends DemoStatus {
  accessToken: string;
  sampleQuestions: string[];
}
