from anthropic import Anthropic
from dotenv import load_dotenv
from src.algovox.system_prompt import SYSTEM_PROMPT

load_dotenv()

client = Anthropic()


class Interviewer:
    def __init__(self, problem: dict):
        self.problem = problem
        self.history = []
        self.system = SYSTEM_PROMPT.format(problem=problem["prompt"])

    def chat(self, user_message: str) -> str:
        self.history.append({"role": "user", "content": user_message})

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=200,
            system=self.system,
            messages=self.history
        )

        reply = response.content[0].text
        self.history.append({"role": "assistant", "content": reply})
        return reply

    def trim_history(self, max_turns: int = 20):
        if len(self.history) > max_turns * 2:
            self.history = self.history[-(max_turns * 2):]

    def generate_report(self) -> str:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1000,
            system="You are evaluating a mock technical interview.",
            messages=self.history + [{
                "role": "user",
                "content": """Review this interview transcript and evaluate the candidate on:
                1. Correctness of their approach
                2. Time and space complexity analysis
                3. Clarity of explanation
                4. Edge cases identified vs missed
                5. How they responded to hints
                Give an overall summary and top 3 takeaways for improvement."""
            }]
        )
        return response.content[0].text