from src.algovox.audio import record
from src.algovox.transcribe import transcribe
from src.algovox.interviewer import Interviewer
from src.algovox.problems import get_random_problem


def main():
    problem = get_random_problem()
    print(f"\nProblem: {problem['title']} [{problem['difficulty']}]\n")

    interviewer = Interviewer(problem)

    while True:
        audio = record()
        if len(audio) == 0:
            break

        transcript = transcribe(audio)
        print(f"\nYou: {transcript}")

        response = interviewer.chat(transcript)
        print(f"Interviewer: {response}\n")


if __name__ == "__main__":
    main()