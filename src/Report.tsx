import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, User } from "lucide-react";

type TabView = "summary" | "solution" | "transcript";

const Report = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabView>("summary");

  // Hardcoded data for demonstration
  const report = {
    problem: "Two Sum",
    date: "Mar 5, 2026",
    score: 78,
    timeTaken: "24 min",
    hintsUsed: 3,
    whatWentWell: [
      "Identified the optimal hash table approach quickly",
      "Clearly explained time and space complexity",
      "Wrote clean, readable code with good variable names",
    ],
    areasToImprove: [
      "Could have discussed edge cases earlier in the interview",
      "Spent too much time on the brute force approach",
      "Minor syntax error that required debugging",
    ],
    code: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
    transcript: [
      { speaker: "Interviewer", text: "Hi, welcome to your mock interview. Have you had a chance to read through the problem?" },
      { speaker: "You", text: "Yes I have. My approach would be to use a hashmap to store each number and its index." },
      { speaker: "Interviewer", text: "Good start. Can you walk me through the time and space complexity of that approach?" },
      { speaker: "You", text: "Sure, it would be O(n) time and O(n) space." },
      { speaker: "Interviewer", text: "Excellent. Can you think of any edge cases we should consider?" },
      { speaker: "You", text: "Yes, we should handle the case where the array is empty or has only one element." },
      { speaker: "Interviewer", text: "Perfect. Now let's see your implementation." },
      { speaker: "You", text: "Here's my solution using a hash table to track seen values..." },
    ],
  };

  return (
    <div className="h-screen bg-[#0a0a10] text-gray-300 overflow-y-auto">
      <div className="max-w-[1000px] mx-auto p-10">
        {/* Back Button */}
        <button
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          onClick={() => navigate("/home")}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{report.problem}</h1>
          <p className="text-lg text-gray-400">{report.date}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#1a1a28] mb-10">
          <nav className="flex gap-8">
            <button
              className={`pb-4 px-1 text-base font-medium transition-colors border-b-2 ${
                activeTab === "summary"
                  ? "text-white border-[#7c6aff]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              className={`pb-4 px-1 text-base font-medium transition-colors border-b-2 ${
                activeTab === "solution"
                  ? "text-white border-[#7c6aff]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("solution")}
            >
              Solution
            </button>
            <button
              className={`pb-4 px-1 text-base font-medium transition-colors border-b-2 ${
                activeTab === "transcript"
                  ? "text-white border-[#7c6aff]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("transcript")}
            >
              Transcript
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "summary" && (
          <>
            {/* Performance Summary */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">Performance Summary</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">{report.score}/100</div>
                  <div className="text-sm text-gray-400">Overall Score</div>
                </div>
                <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">{report.timeTaken}</div>
                  <div className="text-sm text-gray-400">Time Taken</div>
                </div>
                <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">{report.hintsUsed}</div>
                  <div className="text-sm text-gray-400">Hints Used</div>
                </div>
              </div>
            </section>

            {/* Feedback */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">Feedback</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">What went well</h3>
                  <ul className="space-y-3">
                    {report.whatWentWell.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-green-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">Areas to improve</h3>
                  <ul className="space-y-3">
                    {report.areasToImprove.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-amber-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "solution" && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Your Solution</h2>
            <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6">
              <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
                {report.code}
              </pre>
            </div>
          </section>
        )}

        {activeTab === "transcript" && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Session Transcript</h2>
            <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-6 max-h-[500px] overflow-y-auto">
              <div className="space-y-5">
                {report.transcript.map((message, index) => (
                  <div key={index} className="flex gap-3">
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
          </section>
        )}
      </div>
    </div>
  );
};

export default Report;
