import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, FileText, Loader2, Mic } from "lucide-react";

type NavItem = "practice" | "transcripts" | "mic-test";

interface Turn {
  userText: string;
  agentText: string | null;
  isThinking: boolean;
}

interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
}

interface Session {
  id: number;
  problemTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  date: string;
  generating: boolean;
}

const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["Stack", "String"],
  },
  {
    id: 3,
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
  },
  {
    id: 4,
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    tags: ["Array", "Dynamic Programming"],
  },
  {
    id: 5,
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    tags: ["Hash Table", "Sliding Window"],
  },
];

const SESSIONS: Session[] = [
  {
    id: 1,
    problemTitle: "Two Sum",
    difficulty: "Easy",
    date: "Mar 15, 2026",
    generating: false,
  },
  {
    id: 2,
    problemTitle: "Valid Parentheses",
    difficulty: "Easy",
    date: "Mar 14, 2026",
    generating: false,
  },
  {
    id: 3,
    problemTitle: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    date: "Mar 13, 2026",
    generating: true, // This one is generating
  },
];

function Home() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavItem>("practice");

  // Voice loop state
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcriptionError, setTranscriptionError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.electron) {
      setTranscriptionError("Electron API not available. Make sure the app is running in Electron.");
      console.error("window.electron is not available");
      return;
    }

    window.electron.onTranscript((type, text) => {
      if (!text.trim()) return;
      if (type === "interim") {
        setInterim(text);
      } else {
        // final — start a new turn
        setInterim("");
        setTurns(prev => [...prev, { userText: text, agentText: null, isThinking: true }]);
      }
    });

    window.electron.onAgentThinking(() => {
      // already handled by isThinking flag in turn
    });

    window.electron.onAgentResponse((text) => {
      setTurns(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) last.agentText = text;
        return updated;
      });
    });

    window.electron.onTTSAudio(async (base64) => {
      // Decode and play audio
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        window.electron.playbackDone();

        // Mark thinking done
        setTurns(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.isThinking = false;
          return updated;
        });
      };
      audio.play();
    });

    window.electron.onConnectionClosed(() => {
      console.log("Connection closed by server");
      setIsListening(false);
      setInterim("");
    });
  }, []);

  useEffect(() => {
    if (activeNav === "mic-test") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, interim, activeNav]);

  const toggleListening = async () => {
    if (!window.electron) {
      console.error("window.electron is not available");
      return;
    }

    if (isListening) {
      await window.electron.stopListening();
      setIsListening(false);
      setInterim("");
    } else {
      setTurns([]);
      await window.electron.startListening();
      setIsListening(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-neutral-400 bg-neutral-800";
      case "Medium":
        return "text-neutral-300 bg-neutral-700";
      case "Hard":
        return "text-neutral-200 bg-neutral-600";
      default:
        return "text-neutral-400 bg-neutral-800";
    }
  };

  const renderContent = () => {
    switch (activeNav) {
      case "practice":
        return (
          <div className="max-w-4xl w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Ready to practice?</h1>
            <p className="text-lg text-neutral-400 mb-8">
              Jump into a mock interview session with AI-powered feedback
            </p>

            <div className="flex flex-col gap-4">
              {PROBLEMS.map((problem) => (
                <div
                  key={problem.id}
                  className="flex justify-between items-start px-6 py-5 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
                >
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {problem.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded text-xs font-medium text-neutral-400 bg-neutral-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/session", { state: { problem } })}
                    className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200 transition whitespace-nowrap ml-6"
                  >
                    Start Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case "transcripts":
        return (
          <div className="max-w-4xl w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Past Performances</h1>
            <p className="text-lg text-neutral-400 mb-8">
              Review your mock interview sessions and track your progress
            </p>

            <div className="flex flex-col gap-4">
              {SESSIONS.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-start px-6 py-5 bg-neutral-900 border border-neutral-800 rounded-lg"
                >
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{session.problemTitle}</h3>
                    </div>
                    <p className="text-sm text-neutral-400">{session.date}</p>
                  </div>
                  {session.generating ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-neutral-500 rounded-lg font-semibold cursor-not-allowed ml-6"
                    >
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/report/${session.id}`)}
                      className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200 transition whitespace-nowrap ml-6"
                    >
                      View Report
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "mic-test":
        return (
          <div className="max-w-4xl w-full flex flex-col">
            <h1 className="text-4xl font-bold text-white mb-4">Voice Loop Test</h1>
            <p className="text-lg text-neutral-400 mb-8">
              Speak → Claude responds → TTS plays → mic reopens
            </p>

            {transcriptionError && (
              <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded-lg text-red-200">
                {transcriptionError}
              </div>
            )}

            <button
              onClick={toggleListening}
              className={`w-fit px-6 py-3 rounded-lg font-semibold transition-colors mb-8 ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isListening ? "⏹ Stop" : "🎤 Begin Listening"}
            </button>

            <div className="flex flex-col gap-4">
              {turns.map((turn, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {/* User turn */}
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">You</p>
                    <p className="text-white">{turn.userText}</p>
                  </div>
                  {/* Agent turn */}
                  <div className="bg-neutral-700 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">AlgoVox</p>
                    {turn.isThinking && !turn.agentText ? (
                      <p className="text-neutral-400 italic animate-pulse">Thinking...</p>
                    ) : (
                      <p className="text-green-400">{turn.agentText}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Live interim */}
              {interim && (
                <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-600">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">You</p>
                  <p className="text-neutral-300 italic">{interim}</p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300 overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed left-6 top-5 bottom-5 flex flex-col items-center z-10 w-56">
        <div className="text-3xl font-extrabold text-white tracking-tight mt-8 mb-12">
          AlgoVox
        </div>

        <nav className="flex flex-col gap-3 flex-1 justify-center items-start w-full">
          <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all w-full ${
              activeNav === "practice"
                ? "text-white bg-white bg-opacity-10"
                : "text-neutral-500 hover:text-neutral-400 hover:bg-white hover:bg-opacity-5"
            }`}
            onClick={() => setActiveNav("practice")}
          >
            <PlayCircle size={20} />
            <span>Practice</span>
          </button>

          <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all w-full ${
              activeNav === "transcripts"
                ? "text-white bg-white bg-opacity-10"
                : "text-neutral-500 hover:text-neutral-400 hover:bg-white hover:bg-opacity-5"
            }`}
            onClick={() => setActiveNav("transcripts")}
          >
            <FileText size={20} />
            <span>Transcripts</span>
          </button>

          <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all w-full ${
              activeNav === "mic-test"
                ? "text-white bg-white bg-opacity-10"
                : "text-neutral-500 hover:text-neutral-400 hover:bg-white hover:bg-opacity-5"
            }`}
            onClick={() => setActiveNav("mic-test")}
          >
            <Mic size={20} />
            <span>Mic Test</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto p-10 flex justify-center">
        {renderContent()}
      </main>
    </div>
  );
}

export default Home;
