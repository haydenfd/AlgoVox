import { Question } from "./sessionState";

export const HARDCODED_QUESTION: Question = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "easy",
  description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets and in the correct order.",
  examples: [
    "Input: s = '()' → Output: true",
    "Input: s = '()[]{}' → Output: true",
    "Input: s = '(]' → Output: false",
  ],
  constraints: [
    "1 <= s.length <= 10^4",
    "s consists of parentheses only '()[]{}'",
  ],
};
