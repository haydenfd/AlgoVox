import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pause, Trash2 } from "lucide-react";
import Editor from "@monaco-editor/react";

interface Problem {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
}

function Session() {
  const navigate = useNavigate();
  const location = useLocation();
  const problem = (location.state as { problem?: Problem })?.problem;

  const [code, setCode] = useState("# Start coding here...\n");
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(30 * 60); // 30 minutes in seconds

  // Timer - countdown
  useEffect(() => {
    if (isPaused || seconds === 0) return;

    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, seconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndSession = () => {
    navigate("/home");
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
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
            <Pause size={18} />
            <span>Pause</span>
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
            <div className="text-neutral-400">
              <p>Conversation transcript will appear here...</p>
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
