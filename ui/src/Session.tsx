import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { PauseCircle, PhoneOff, Bot, User, Play } from "lucide-react";

interface Message {
  speaker: "Interviewer" | "You";
  text: string;
}

// const HARDCODED_MESSAGES: Message[] = [
//   {
//     speaker: "Interviewer",
//     text: "Hi, welcome to your mock interview. Have you had a chance to read through the problem?",
//   },
//   {
//     speaker: "You",
//     text: "Yes I have. My approach would be to use a hashmap to store each number and its index.",
//   },
//   {
//     speaker: "Interviewer",
//     text: "Good start. Can you walk me through the time and space complexity of that approach?",
//   },
//   {
//     speaker: "You",
//     text: "Sure, it would be O(n) time and O(n) space.",
//   },
// ];

type MicStatus = "listening" | "interviewer-speaking" | "processing";

const Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const problemPrompt = location.state?.prompt ?? `# Problem: Two Sum [Easy]
# Given an array of integers nums and an integer target,
# return indices of the two numbers that add up to target.
#
# Example: nums = [2,7,11,15], target = 9 → [0,1]

from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass`;
  const [code, setCode] = useState(problemPrompt);
  const [micStatus, setMicStatus] = useState<MicStatus>("listening");
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const ws = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws/transcribe");

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "status") {
        setMicStatus(msg.value as MicStatus);
      }
      if (msg.type === "transcript") {
        setMessages(prev => [...prev, { speaker: "You", text: msg.value }]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => ws.current?.close();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleEndSession = () => {
    navigate("/home");
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMicStatusDisplay = () => {
    switch (micStatus) {
      case "listening":
        return (
          <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            <span>Listening...</span>
          </div>
        );
      case "interviewer-speaking":
        return (
          <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
            <span className="flex items-center gap-0.5 h-5">
              <span className="w-0.5 h-full bg-blue-500 rounded-sm animate-wave"></span>
              <span className="w-0.5 h-full bg-blue-500 rounded-sm animate-wave [animation-delay:0.15s]"></span>
              <span className="w-0.5 h-full bg-blue-500 rounded-sm animate-wave [animation-delay:0.3s]"></span>
            </span>
            <span>Interviewer speaking...</span>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
            <span className="w-4 h-4 border-2 border-[#3e3e42] border-t-blue-500 rounded-full animate-spin"></span>
            <span>Processing...</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-gray-300 overflow-hidden relative">
      {/* Pause Overlay */}
      {isPaused && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] cursor-pointer animate-fadeIn"
          onClick={handlePause}
        >
          <div className="text-center flex flex-col items-center gap-4 p-10 rounded-xl bg-[#252526]/95 border border-[#3e3e42] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Play size={48} className="text-blue-500 animate-pulseIcon" />
            <h2 className="text-3xl font-semibold text-white m-0">Interview Paused</h2>
            <p className="text-base text-gray-400 m-0">Click anywhere to resume</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="relative flex justify-between items-center px-6 py-3 bg-[#252526] border-b border-[#3e3e42] h-14 shrink-0">
        <div className="text-xl font-semibold text-white tracking-tight">AlgoVox</div>
        <div className="absolute left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg">
          <div className="text-lg font-mono text-white">
            {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent border-none text-gray-300 cursor-pointer rounded-md text-sm font-medium hover:bg-[#3e3e42] hover:text-white transition-all"
            onClick={handlePause}
          >
            <PauseCircle size={20} />
            <span>Pause Session</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent border-none text-gray-300 cursor-pointer rounded-md text-sm font-medium hover:bg-red-600 hover:text-white transition-all"
            onClick={handleEndSession}
          >
            <PhoneOff size={20} />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat Transcript */}
        <div className="w-[30%] bg-[#252526] border-r border-[#3e3e42] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1e1e1e] [&::-webkit-scrollbar-thumb]:bg-[#3e3e42] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[#4e4e52]">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-3 animate-fadeIn">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                    message.speaker === "Interviewer"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {message.speaker === "Interviewer" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-[13px] text-white">{message.speaker}</div>
                  <div className="text-sm leading-relaxed text-gray-300">{message.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-[70%] bg-[#1e1e1e] overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-center items-center p-4 bg-[#252526] border-t border-[#3e3e42] h-[60px] shrink-0">
        {getMicStatusDisplay()}
      </div>
    </div>
  );
};

export default Session;
