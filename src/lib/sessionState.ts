export type Phase = "intro" | "discussion" | "coding" | "optimization" | "complete";

export interface Question {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: string[];
  constraints: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface SessionState {
  phase: Phase;
  question: Question;
  conversationHistory: Message[];
  hasProposedApproach: boolean;
  codingStarted: boolean;
  code: string;
  startedAt: Date;
}

export function createInitialState(question: Question): SessionState {
  return {
    phase: "intro",
    question,
    conversationHistory: [],
    hasProposedApproach: false,
    codingStarted: false,
    code: "",
    startedAt: new Date(),
  };
}
