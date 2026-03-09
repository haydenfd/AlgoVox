import time
from pathlib import Path
from src.algovox.problems import get_random_problem

SOLUTION_FILE = "solution.py"
POLL_INTERVAL = 0.5

import sys

def typewrite(text: str, delay: float = 0.02) -> None:
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def write_problem_to_file(problem: dict, delay: float = 0.01) -> None:
    prompt_lines = "\n".join(f"# {line}" for line in problem["prompt"].splitlines())
    content = f"""{prompt_lines}

from typing import List

class Solution:
    def solve(self):
        pass
"""
    path = Path(SOLUTION_FILE)
    
    # write character by character
    accumulated = ""
    for char in content:
        accumulated += char
        path.write_text(accumulated)
        time.sleep(delay)
    
    print(f"Written to {SOLUTION_FILE}")

def main():
    problem = get_random_problem()
    print(f"\nProblem: {problem['title']} [{problem['difficulty']}]")

    input("\nPress Enter to populate solution.py...")
    write_problem_to_file(problem)

    print("\nWatching solution.py — edit and save in VS Code.\n")

    last_content = ""
    while True:
        try:
            content = Path(SOLUTION_FILE).read_text()
            if content != last_content:
                last_content = content
                print(f"[Updated] {len(content)} chars")
        except FileNotFoundError:
            pass
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    if "--server" in sys.argv:
        import uvicorn
        uvicorn.run("src.algovox.server:app", host="127.0.0.1", port=8000, reload=False)
    else:
        main()