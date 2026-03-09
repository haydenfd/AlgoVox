from anthropic import Anthropic
from dotenv import load_dotenv
from src.algovox.system_prompt import SYSTEM_PROMPT
import re

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

    def chat_stream(self, user_message: str):
        """
        Stream Claude's response sentence by sentence.
        Yields complete sentences as they arrive so TTS can start immediately.
        """
        self.history.append({"role": "user", "content": user_message})

        full_reply = ""
        buffer = ""

        with client.messages.stream(
            model="claude-haiku-4-5",
            max_tokens=200,
            system=self.system,
            messages=self.history
        ) as stream:
            for text in stream.text_stream:
                buffer += text
                full_reply += text

                # yield complete sentences as they arrive
                sentences = re.split(r'(?<=[.!?])\s+', buffer)
                # last element may be incomplete, keep it in buffer
                for sentence in sentences[:-1]:
                    if sentence.strip():
                        yield sentence.strip()
                buffer = sentences[-1]

        # yield anything remaining in buffer
        if buffer.strip():
            yield buffer.strip()

        self.history.append({"role": "assistant", "content": full_reply})

    def trim_history(self, max_turns: int = 20):
        if len(self.history) > max_turns * 2:
            self.history = self.history[-(max_turns * 2):]