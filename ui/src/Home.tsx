import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, FileText, User, Loader2 } from "lucide-react";

type NavItem = "practice" | "transcripts"; // | "config";

interface Problem {
  id: number;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  prompt: string;
}

const PROBLEMS: Problem[] = [
  {
    id: 1,
    name: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    prompt: `# Problem: Two Sum [Easy]
# Given an array of integers nums and an integer target,
# return indices of the two numbers that add up to target.
# You may assume each input has exactly one solution.
#
# Example: nums = [2,7,11,15], target = 9 → [0,1]`,
  },
  {
    id: 2,
    name: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["Stack", "String"],
    prompt: `# Problem: Valid Parentheses [Easy]
# Given a string s containing just '(', ')', '{', '}', '[' and ']',
# determine if the input string is valid.
#
# Example: s = "()[]{}" → true, s = "(]" → false`,
  },
  {
    id: 3,
    name: "Climbing Stairs",
    difficulty: "Easy",
    tags: ["Dynamic Programming"],
    prompt: `# Problem: Climbing Stairs [Easy]
# You are climbing a staircase with n steps.
# Each time you can climb 1 or 2 steps.
# In how many distinct ways can you climb to the top?
#
# Example: n = 3 → 3 (1+1+1, 1+2, 2+1)`,
  },
  {
    id: 4,
    name: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    tags: ["Array", "Greedy"],
    prompt: `# Problem: Best Time to Buy and Sell Stock [Easy]
# Given an array prices where prices[i] is the price on day i,
# return the maximum profit from a single buy then sell.
#
# Example: prices = [7,1,5,3,6,4] → 5`,
  },
];

const PAST_SESSIONS = [
  { id: 1, problem: "Two Sum", difficulty: "Easy" as const, tags: ["Array", "Hash Table"], date: "Mar 5, 2026", generating: false },
  { id: 2, problem: "Valid Parentheses", difficulty: "Easy" as const, tags: ["Stack", "String"], date: "Mar 3, 2026", generating: false },
  { id: 3, problem: "Climbing Stairs", difficulty: "Easy" as const, tags: ["Dynamic Programming"], date: "Mar 1, 2026", generating: true },
  { id: 4, problem: "Best Time to Buy and Sell Stock", difficulty: "Easy" as const, tags: ["Array", "Greedy"], date: "Feb 27, 2026", generating: false },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavItem>("practice");

  const getDifficultyStyles = (difficulty: string) => {
    const base = "inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider";
    switch (difficulty) {
      case "Easy":
        return `${base} text-green-400 bg-green-400/10`;
      case "Medium":
        return `${base} text-amber-400 bg-amber-400/10`;
      case "Hard":
        return `${base} text-red-400 bg-red-400/10`;
      default:
        return base;
    }
  };

  const renderContent = () => {
    switch (activeNav) {
      case "practice":
        return (
          <div className="max-w-[860px] w-full">
            {/* Hero Section */}
            <section className="mb-16">
              <h1 className="text-5xl font-bold text-white mb-4">Ready to practice?</h1>
              <p className="text-lg text-gray-400 mb-10">Jump into a mock interview session with AI-powered feedback</p>
              {/* <button
                className="inline-flex items-center gap-3 px-10 py-4 bg-[#7c6aff] text-white rounded-lg text-base font-semibold hover:bg-[#6b59e6] transition-all hover:-translate-y-0.5"
                onClick={() => navigate("/session")}
              >
                <PlayCircle size={22} />
                <span>Start Session</span>
              </button> */}
            </section>

            {/* Problem Cards */}
            <section className="flex flex-col gap-4">
              {PROBLEMS.map((problem) => (
                <div key={problem.id} className="flex justify-between items-start px-7 py-6 bg-[#13131f] border border-[#1a1a28] rounded-xl hover:border-[#2a2a38] transition-colors">
                  <div className="flex flex-col gap-3.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={getDifficultyStyles(problem.difficulty)}>
                        {problem.difficulty}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{problem.name}</h3>
                    </div>
                    <div className="flex gap-2.5 flex-wrap">
                      {problem.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 bg-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 ml-6">
                    {problem.practiced ? (
                      <>
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          Practiced on {problem.practicedDate}
                        </span>
                        <div className="flex gap-2.5">
                          <button className="px-5 py-2.5 bg-transparent text-gray-400 border border-[#2a2a38] rounded-lg text-sm font-medium hover:border-[#3e3e42] hover:text-gray-300 transition-all whitespace-nowrap">
                            Check Result
                          </button>
                          <button
                            className="px-5 py-2.5 bg-transparent text-[#7c6aff] border border-[#7c6aff] rounded-lg text-sm font-semibold hover:bg-[#7c6aff] hover:text-white transition-all whitespace-nowrap"
                            onClick={() => navigate("/session", { state: { prompt: problem.prompt } })}
                          >
                            Practice Again
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="px-6 py-3 bg-[#7c6aff] text-white rounded-lg text-[15px] font-semibold hover:bg-[#6b59e6] hover:-translate-y-0.5 transition-all whitespace-nowrap"
                        onClick={() => navigate("/session", { state: { prompt: problem.prompt } })}
                      >
                        Start Mock Interview
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>
        );
      case "transcripts":
        return (
          <div className="max-w-[860px] w-full">
            {/* Header */}
            <section className="mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">Past Performances</h1>
              <p className="text-lg text-gray-400">Review your mock interview sessions and track your progress.</p>
            </section>

            {/* Past Sessions List */}
            <section className="flex flex-col gap-4">
              {PAST_SESSIONS.map((session) => (
                <div key={session.id} className="flex justify-between items-start px-7 py-6 bg-[#13131f] border border-[#1a1a28] rounded-xl hover:border-[#2a2a38] transition-colors">
                  <div className="flex flex-col gap-3.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={getDifficultyStyles(session.difficulty)}>
                        {session.difficulty}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{session.problem}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">{session.date}</span>
                      <div className="flex gap-2.5 flex-wrap">
                        {session.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 bg-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-6">
                    {session.generating ? (
                      <button
                        className="px-6 py-3 bg-transparent text-gray-500 border border-[#2a2a38] rounded-lg text-[15px] font-semibold cursor-not-allowed flex items-center gap-2"
                        disabled
                      >
                        <Loader2 size={16} className="animate-spin" />
                        <span>Generating...</span>
                      </button>
                    ) : (
                      <button
                        className="px-6 py-3 bg-transparent text-[#7c6aff] border border-[#7c6aff] rounded-lg text-[15px] font-semibold hover:bg-[#7c6aff] hover:text-white transition-all whitespace-nowrap"
                        onClick={() => navigate(`/report/${session.id}`)}
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>
        );
      // case "config":
      //   return (
      //     <div className="flex items-center justify-center h-full max-w-[860px] w-full">
      //       <p className="text-base text-gray-500">Interviewer Config — coming soon</p>
      //     </div>
      //   );
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a10] text-gray-300 overflow-hidden relative">
      {/* Floating Left Nav */}
      <aside className="fixed left-6 top-5 bottom-5 flex flex-col items-center z-10 w-[220px]">
        <div className="text-[32px] font-extrabold text-white tracking-tight mt-8 mb-12">AlgoVox</div>

        <nav className="flex flex-col gap-3 flex-1 justify-center items-start w-full">
          <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-[17px] font-medium transition-all w-full ${
              activeNav === "practice"
                ? "text-white bg-lilac"
                : "text-gray-500 hover:text-gray-400 hover:bg-white/5"
            }`}
            onClick={() => setActiveNav("practice")}
          >
            <PlayCircle size={24} />
            <span>Practice</span>
          </button>

          <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-[17px] font-medium transition-all w-full ${
              activeNav === "transcripts"
                ? "text-white bg-lilac"
                : "text-gray-500 hover:text-gray-400 hover:bg-white/5"
            }`}
            onClick={() => setActiveNav("transcripts")}
          >
            <FileText size={24} />
            <span>Transcripts</span>
          </button>

          {/* <button
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-[17px] font-medium transition-all w-full ${
              activeNav === "config"
                ? "text-white bg-lilac"
                : "text-gray-500 hover:text-gray-400 hover:bg-white/5"
            }`}
            onClick={() => setActiveNav("config")}
          >
            <Settings size={24} />
            <span>Interviewer</span>
          </button> */}
        </nav>

        <div className="flex items-center justify-center gap-2.5 py-5 text-sm text-gray-500 border-t border-white/8 w-full">
          <div className="w-7 h-7 rounded-full bg-[#2a2a38] flex items-center justify-center text-gray-500">
            <User size={14} />
          </div>
          <span>User</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 overflow-y-auto p-10 flex justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default Home;
