import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pause, Play, Trash2, User } from "lucide-react";
import Editor from "@monaco-editor/react";
import { createInitialState, SessionState } from "./lib/sessionState";
import { buildSystemPrompt } from "./lib/promptBuilder";
import { HARDCODED_QUESTION } from "./lib/questions";

interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
}

interface TranscriptEntry {
  text: string;
  timestamp: Date;
  isUser: boolean;
  isThinking?: boolean;
}

const INITIAL_EDITOR_CONTENT = `# Valid Parentheses - Easy
#
# Given a string containing just the characters '(', ')', '{', '}', '[' and ']',
# determine if the input string is valid.
#
# Examples:
#   Input: "()"      → Output: true
#   Input: "()[]{}"  → Output: true
#   Input: "(]"      → Output: false

# Start coding here...
`;

function Session() {
  const navigate = useNavigate();
  const location = useLocation();
  const problem = (location.state as { problem?: Problem })?.problem;

  const [code, setCode] = useState(INITIAL_EDITOR_CONTENT);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(30 * 60); // 30 minutes in seconds
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState("");
  const [activeTab, setActiveTab] = useState<"ai" | "user">("ai");
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Timer - countdown
  useEffect(() => {
    if (isPaused || seconds === 0) return;

    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, seconds]);

  // Initialize session state on mount
  useEffect(() => {
    const state = createInitialState(HARDCODED_QUESTION);
    setSessionState(state);

    const prompt = buildSystemPrompt(state);

    console.log("=== SESSION STATE ===");
    console.log(JSON.stringify(state, null, 2));
    console.log("=== SYSTEM PROMPT ===");
    console.log(prompt);
    console.log("====================");
  }, []);

  // Start listening when component mounts
  useEffect(() => {
    if (!window.electron) {
      console.error("window.electron is not available");
      return;
    }

    // Start listening immediately
    window.electron.startListening().catch((err) => {
      console.error("Failed to start listening:", err);
    });

    // Set up transcript listeners
    window.electron.onTranscript((type, text) => {
      if (!text.trim()) return;

      if (type === "interim") {
        setInterimText(text);
      } else {
        // final - add to transcript list
        setInterimText("");
        setTranscripts((prev) => [
          ...prev,
          { text, timestamp: new Date(), isUser: true },
        ]);
      }
    });

    // Agent thinking
    window.electron.onAgentThinking(() => {
      setInterimText(""); // Clear any lingering interim text
      setTranscripts((prev) => [
        ...prev,
        { text: "", timestamp: new Date(), isUser: false, isThinking: true },
      ]);
    });

    // Agent response
    window.electron.onAgentResponse((text) => {
      setTranscripts((prev) => {
        const updated = [...prev];
        const lastEntry = updated[updated.length - 1];
        if (lastEntry && lastEntry.isThinking) {
          lastEntry.text = text;
          lastEntry.isThinking = false;
        }
        return updated;
      });
    });

    // Clean up when component unmounts
    return () => {
      window.electron.stopListening().catch((err) => {
        console.error("Failed to stop listening:", err);
      });
    };
  }, []);

  // Auto-scroll to bottom of transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, interimText]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndSession = async () => {
    // Stop listening before navigating away
    if (window.electron) {
      await window.electron.stopListening();
    }
    navigate("/home");
  };

  const handlePauseToggle = async () => {
    if (!window.electron) return;

    if (isPaused) {
      // Resume listening
      await window.electron.startListening();
      setIsPaused(false);
    } else {
      // Pause listening
      await window.electron.stopListening();
      setIsPaused(true);
    }
  };

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        <div className="text-center">
          <p className="mb-4">No problem selected</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="text-2xl font-bold text-white">AlgoVox</div>

        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-white">{formatTime(seconds)}</div>
          <button
            onClick={handlePauseToggle}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition"
          >
            <Trash2 size={18} />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Transcript */}
        <div className="w-1/3 border-r border-neutral-800 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Transcript</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "ai"
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                AI
              </button>
              <button
                onClick={() => setActiveTab("user")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === "user"
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                User
              </button>
            </div>

            {transcripts.length === 0 && !interimText && (
              <div className="text-neutral-400">
                <p>Start speaking to see your transcript...</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {transcripts
                .filter((entry) => {
                  if (activeTab === "ai") return !entry.isUser;
                  if (activeTab === "user") return entry.isUser;
                  return true;
                })
                .map((entry, index) => (
                <div key={index} className="flex gap-3">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.isUser ? "bg-neutral-700" : "bg-white"
                  }`}>
                    {entry.isUser ? (
                      <User size={16} className="text-neutral-300" />
                    ) : (
                      <span className="text-black font-bold text-xs">AI</span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-neutral-300">
                        {entry.isUser ? "You" : "AlgoVox"}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {entry.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {entry.isThinking ? (
                      <p className="text-neutral-400 italic animate-pulse">Thinking...</p>
                    ) : (
                      <p className={`leading-relaxed ${
                        entry.isUser ? "text-neutral-200" : "text-neutral-200"
                      }`}>{entry.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Interim text (live transcription) */}
              {interimText && (
                <div className="flex gap-3 opacity-60">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    <User size={16} className="text-neutral-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-neutral-300">You</span>
                      <span className="text-xs text-neutral-500 italic">speaking...</span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed italic">{interimText}</p>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: !sessionState?.codingStarted,
            }}
          />
        </div>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div
          onClick={handlePauseToggle}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center cursor-pointer z-50"
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Paused</h2>
            <p className="text-neutral-400">Click anywhere to resume</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Session;
