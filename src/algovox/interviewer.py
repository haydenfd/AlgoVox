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