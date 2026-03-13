import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, FileText, User, Loader2, LogOut, X, Mic, Volume2, MicOff, Play } from "lucide-react";
import { useAuth } from "./AuthContext";
import { invoke } from "@tauri-apps/api/core";
// import { fetch } from "@tauri-apps/plugin-http";

type NavItem = "practice" | "transcripts"; 

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
  const { user, logout, isLoading } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>("practice");
  const [showLeetCodeModal, setShowLeetCodeModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState("");
  const [leetcodeSession, setLeetcodeSession] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [showCookieInput, setShowCookieInput] = useState(false);
  const [hasStoredCookies, setHasStoredCookies] = useState(false);
  const [sttResult, setSttResult] = useState("");
  const [sttLoading, setSttLoading] = useState(false);
  const [sttError, setSttError] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [ttsSuccess, setTtsSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleTestSTT = async () => {
    console.log("🎤 Starting STT test...");
    setSttLoading(true);
    setSttError("");
    setSttResult("");

    try {
      console.log("📡 Calling Rust command: test_stt");
      const transcript = await invoke<string>("test_stt");
      console.log("✅ STT SUCCESS!");
      console.log("📝 Transcript received:", transcript);
      setSttResult(transcript);
    } catch (error) {
      console.error("❌ STT FAILED:", error);
      setSttError(error as string);
    } finally {
      setSttLoading(false);
      console.log("🏁 STT test complete");
    }
  };

  const handleTestTTS = async () => {
    console.log("🔊 Starting TTS test...");
    setTtsLoading(true);
    setTtsError("");
    setTtsSuccess(false);

    try {
      console.log("📡 Calling Rust command: test_tts");
      const base64Audio = await invoke<string>("test_tts");
      console.log("✅ TTS SUCCESS!");
      console.log("🎵 Audio received (base64 length):", base64Audio.length);

      // Convert base64 to audio and play it
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.play();
      console.log("🎧 Playing audio...");

      setTtsSuccess(true);

      // Clean up URL after audio finishes
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log("🏁 Audio playback complete");
      };
    } catch (error) {
      console.error("❌ TTS FAILED:", error);
      setTtsError(error as string);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    console.log("🎤 Starting mic recording...");
    try {
      await invoke("start_recording");
      setIsRecording(true);
      console.log("✅ Recording started");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    console.log("🛑 Stopping mic recording...");
    try {
      const base64Audio = await invoke<string>("stop_recording");
      setRecordedAudio(base64Audio);
      setIsRecording(false);
      console.log("✅ Recording stopped, audio saved");
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
    }
  };

  const handlePlayRecording = () => {
    if (!recordedAudio) return;

    console.log("🎧 Playing recorded audio...");
    const audioBytes = Uint8Array.from(atob(recordedAudio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log("🏁 Playback complete");
    };
  };


  const openLeetCodeLogin = () => {
    window.open("https://leetcode.com/accounts/login/", "_blank");
    setShowCookieInput(true);
  };

  const loadStoredCookies = () => {
    const stored = localStorage.getItem("leetcode_cookies");
    if (stored) {
      try {
        const { session, csrf } = JSON.parse(stored);
        setLeetcodeSession(session);
        setCsrfToken(csrf);
        setHasStoredCookies(true);
        return { session, csrf };
      } catch (e) {
        console.error("Failed to parse stored cookies:", e);
      }
    }
    return null;
  };

  const saveCookies = (session: string, csrf: string) => {
    localStorage.setItem("leetcode_cookies", JSON.stringify({ session, csrf }));
    console.log("✓ Cookies saved for future use");
  };

  const clearStoredCookies = () => {
    localStorage.removeItem("leetcode_cookies");
    setLeetcodeSession("");
    setCsrfToken("");
    setHasStoredCookies(false);
  };

  const tryImportWithCookies = async (session: string, csrf: string) => {
    setIsImporting(true);
    setImportError("");
    setImportSuccess(false);

    try {
      const allQuestions: any[] = [];
      let skip = 0;
      const limit = 50;
      let totalNum = 0;

      console.log("Starting LeetCode import with pagination...");

      // Keep fetching pages until we have all questions
      do {
        console.log(`Fetching page: skip=${skip}, limit=${limit}`);

        const response = await fetch("https://leetcode.com/graphql/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
            "Cookie": `LEETCODE_SESSION=${leetcodeSession}; csrftoken=${csrfToken}`,
            "x-csrftoken": csrfToken,
          },
          body: JSON.stringify({
            query: `
              query userProgressQuestionList($filters: UserProgressQuestionListInput) {
                userProgressQuestionList(filters: $filters) {
                  totalNum
                  questions {
                    translatedTitle
                    frontendId
                    title
                    titleSlug
                    difficulty
                    lastSubmittedAt
                    numSubmitted
                    questionStatus
                    lastResult
                    topicTags {
                      name
                      nameTranslated
                      slug
                    }
                  }
                }
              }
            `,
            variables: {
              filters: {
                skip,
                limit,
              },
            },
            operationName: "userProgressQuestionList",
          }),
        });

        const data = await response.json();
        console.log(`Page response:`, data);

        if (data.errors) {
          console.error("GraphQL errors:", data.errors);
          setImportError(data.errors[0]?.message || "Failed to fetch LeetCode data");
          return;
        }

        const questionList = data.data?.userProgressQuestionList;
        if (!questionList) {
          setImportError("No question data found - check if cookies are valid");
          return;
        }

        totalNum = questionList.totalNum;
        allQuestions.push(...questionList.questions);

        console.log(`✓ Fetched ${allQuestions.length} / ${totalNum} questions`);

        skip += limit;
      } while (allQuestions.length < totalNum);

      console.log("====== IMPORT COMPLETE ======");
      console.log("All LeetCode questions:", allQuestions);
      console.log(`Total questions imported: ${allQuestions.length}`);
      console.log("===========================");

      // Save cookies for future use
      saveCookies(session, csrf);

      setImportSuccess(true);
      return true;
    } catch (error) {
      console.error("Import error:", error);
      setImportError(error instanceof Error ? error.message : "Failed to import data");
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportLeetCode = async () => {
    // First, try with stored cookies if available
    const stored = loadStoredCookies();
    if (stored) {
      console.log("Found stored cookies, attempting import...");
      const success = await tryImportWithCookies(stored.session, stored.csrf);
      if (success) return;

      // If stored cookies failed, clear them and ask for new ones
      console.log("Stored cookies invalid/expired, requesting new authentication");
      clearStoredCookies();
      setImportError("Session expired. Please sign in again.");
      setShowCookieInput(true);
      return;
    }

    // No stored cookies, check if user provided new ones
    if (!leetcodeSession.trim() || !csrfToken.trim()) {
      setImportError("Please provide both LEETCODE_SESSION and csrftoken cookies");
      setShowCookieInput(true);
      return;
    }

    // Try import with user-provided cookies
    await tryImportWithCookies(leetcodeSession, csrfToken);
  };

  const closeModal = () => {
    setShowLeetCodeModal(false);
    setImportError("");
    setImportSuccess(false);
    setShowCookieInput(false);
  };

  // Check for stored cookies when modal opens
  useEffect(() => {
    if (showLeetCodeModal) {
      const stored = loadStoredCookies();
      if (stored) {
        console.log("Found stored LeetCode cookies");
      }
    }
  }, [showLeetCodeModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a10]">
        <Loader2 size={48} className="text-[#7c6aff] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              {/* <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-[#7c6aff] border border-[#7c6aff] rounded-lg text-sm font-semibold hover:bg-[#7c6aff] hover:text-white transition-all"
                onClick={() => setShowLeetCodeModal(true)}
              >
                <Database size={18} />
                <span>Import LeetCode Data</span>
              </button> */}

              {/* STT & TTS Tests */}
              <div className="mt-8 p-6 bg-[#13131f] border border-[#1a1a28] rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Deepgram Tests</h3>

                {/* Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleTestSTT}
                    disabled={sttLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#7c6aff] text-white rounded-lg text-sm font-semibold hover:bg-[#6b59e6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sttLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        <span>Test STT</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleTestTTS}
                    disabled={ttsLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-[#7c6aff] text-white rounded-lg text-sm font-semibold hover:bg-[#6b59e6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ttsLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={18} />
                        <span>Test TTS</span>
                      </>
                    )}
                  </button>
                </div>

                {/* STT Results */}
                {sttResult && (
                  <div className="mt-4 p-4 bg-green-400/10 border border-green-400/20 rounded-lg">
                    <p className="text-sm font-semibold text-green-400 mb-1">STT Transcript:</p>
                    <p className="text-white">{sttResult}</p>
                  </div>
                )}
                {sttError && (
                  <div className="mt-4 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <p className="text-sm font-semibold text-red-400 mb-1">STT Error:</p>
                    <p className="text-red-300 text-sm">{sttError}</p>
                  </div>
                )}

                {/* TTS Results */}
                {ttsSuccess && (
                  <div className="mt-4 p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                    <p className="text-sm font-semibold text-blue-400">TTS audio is playing! 🎧</p>
                  </div>
                )}
                {ttsError && (
                  <div className="mt-4 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <p className="text-sm font-semibold text-red-400 mb-1">TTS Error:</p>
                    <p className="text-red-300 text-sm">{ttsError}</p>
                  </div>
                )}
              </div>

              {/* Mic Test */}
              <div className="mt-8 p-6 bg-[#13131f] border border-[#1a1a28] rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Microphone Test</h3>

                <div className="space-y-4">
                  {/* Control Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-[#7c6aff] hover:bg-[#6b59e6] text-white"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff size={18} />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={18} />
                          <span>Start Recording</span>
                        </>
                      )}
                    </button>

                    {recordedAudio && !isRecording && (
                      <button
                        onClick={handlePlayRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all"
                      >
                        <Play size={18} />
                        <span>Play Recording</span>
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-sm text-gray-400">
                    {isRecording ? "🔴 Recording..." : recordedAudio ? "✅ Recording saved - click Play to listen" : "⚪ No recording"}
                  </div>
                </div>
              </div>
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

        <div className="border-t border-white/8 w-full pt-4">
          <div className="flex items-center gap-2.5 mb-3 px-2">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2a2a38] flex items-center justify-center text-gray-400">
                <User size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 overflow-y-auto p-10 flex justify-center">
        {renderContent()}
      </main>

      {/* LeetCode Import Modal */}
      {showLeetCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13131f] border border-[#1a1a28] rounded-xl p-8 w-full max-w-md relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Import LeetCode Data</h2>
            <p className="text-sm text-gray-400 mb-6">
              {hasStoredCookies
                ? "We'll use your saved LeetCode session. Click to start importing."
                : "Import all your LeetCode question progress and submission history"}
            </p>

            {!importSuccess ? (
              <div className="space-y-4">
                {!showCookieInput && !hasStoredCookies && (
                  <>
                    <div className="text-sm text-gray-300 bg-[#1a1a28] border border-[#2a2a38] rounded-lg px-4 py-3">
                      <p className="mb-2">This requires signing in to LeetCode to access your data.</p>
                      <p className="text-gray-400">Your session will be saved locally and reused (~30 day expiry).</p>
                    </div>
                    <button
                      onClick={() => setShowCookieInput(true)}
                      className="w-full px-4 py-2 bg-[#1a1a28] text-gray-300 border border-[#2a2a38] rounded-lg text-sm font-medium hover:border-[#3e3e42] transition-all"
                    >
                      Continue to Sign In
                    </button>
                  </>
                )}

                {showCookieInput && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300 bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-3">
                      <p className="font-semibold mb-2">How to get your cookies:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-400">
                        <li>Sign in to LeetCode (button below)</li>
                        <li>Open DevTools (F12 or Cmd+Option+I)</li>
                        <li>Go to Application → Cookies → https://leetcode.com</li>
                        <li>Copy LEETCODE_SESSION and csrftoken values</li>
                        <li>Paste them below</li>
                      </ol>
                    </div>

                    <button
                      onClick={openLeetCodeLogin}
                      className="w-full px-4 py-2 bg-[#1a1a28] text-gray-300 border border-[#2a2a38] rounded-lg text-sm font-medium hover:border-[#3e3e42] transition-all"
                    >
                      Open LeetCode Login
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        LEETCODE_SESSION Cookie
                      </label>
                      <input
                        type="text"
                        value={leetcodeSession}
                        onChange={(e) => setLeetcodeSession(e.target.value)}
                        placeholder="Paste LEETCODE_SESSION value"
                        className="w-full px-4 py-2.5 bg-[#0a0a10] border border-[#1a1a28] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6aff] transition-colors font-mono text-xs"
                        disabled={isImporting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        csrftoken Cookie
                      </label>
                      <input
                        type="text"
                        value={csrfToken}
                        onChange={(e) => setCsrfToken(e.target.value)}
                        placeholder="Paste csrftoken value"
                        className="w-full px-4 py-2.5 bg-[#0a0a10] border border-[#1a1a28] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7c6aff] transition-colors font-mono text-xs"
                        disabled={isImporting}
                      />
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    {importError}
                  </div>
                )}

                {(showCookieInput || hasStoredCookies) && (
                  <button
                    onClick={handleImportLeetCode}
                    disabled={isImporting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7c6aff] text-white rounded-lg text-sm font-semibold hover:bg-[#6b59e6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <span>Start Import</span>
                    )}
                  </button>
                )}

                {hasStoredCookies && !showCookieInput && (
                  <button
                    onClick={() => {
                      clearStoredCookies();
                      setShowCookieInput(true);
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Sign out and use different account
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                  LeetCode profile imported and processed. You can close this dialog now.
                </div>
                <button
                  onClick={closeModal}
                  className="w-full px-6 py-3 bg-[#7c6aff] text-white rounded-lg text-sm font-semibold hover:bg-[#6b59e6] transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
