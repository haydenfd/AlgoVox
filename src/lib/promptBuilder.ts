import { SessionState } from "./sessionState";

const BASE_PROMPT = `You are a senior software engineer conducting a technical interview at a top tech company.
You are professional, encouraging, and concise.
Never give away the solution directly.
Respond in plain spoken English only. No markdown, no bullet points, no special characters.
Keep responses short and conversational as they will be read aloud.`;

const INTRO_PROMPT = `You are opening the interview.
Greet the candidate warmly, introduce yourself briefly, and present the problem by reading the description.
Tell them to take their time and ask any clarifying questions before they begin.`;

export function buildSystemPrompt(state: SessionState): string {
  const questionBlock = `Current Problem:
Title: ${state.question.title}
Difficulty: ${state.question.difficulty}
Description: ${state.question.description}`;

  const stateBlock = `Current Interview State:
- Phase: ${state.phase}
- Turns so far: ${state.conversationHistory.length}`;

  return [BASE_PROMPT, INTRO_PROMPT, questionBlock, stateBlock]
    .join("\n\n");
}
