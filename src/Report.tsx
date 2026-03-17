import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type TabType = "general" | "transcript" | "code";

function Report() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Time Taken</div>
                <div className="text-3xl font-bold text-white">24:15</div>
              </div>
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Score</div>
                <div className="text-3xl font-bold text-white">8.5/10</div>
              </div>
            </div>

            {/* What Went Wrong */}
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">What Went Wrong</h2>
              <div className="space-y-3 text-neutral-400">
                <p>
                  Your initial approach had a time complexity issue. The nested loop solution you attempted first would have resulted in O(n²) complexity, which isn't optimal for this problem.
                </p>
                <p>
                  You also spent some time debugging an off-by-one error in your array indexing. This could have been caught earlier with careful boundary checking.
                </p>
              </div>
            </div>

            {/* What You Did Right */}
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">What You Did Right</h2>
              <div className="space-y-3 text-neutral-400">
                <p>
                  You quickly recognized the optimization opportunity and switched to using a hash map, bringing the solution down to O(n) time complexity.
                </p>
                <p>
                  Your communication was clear throughout the session. You explained your thought process well and asked clarifying questions about edge cases.
                </p>
                <p>
                  The final solution was clean and well-structured with good variable naming conventions.
                </p>
              </div>
            </div>
          </div>
        );
      case "transcript":
        return (
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-neutral-400">Conversation transcript will appear here...</p>
          </div>
        );
      case "code":
        return (
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
            <p className="text-neutral-400">Submitted code will appear here...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="max-w-4xl mx-auto p-10">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">
          Session Report #{id}
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              activeTab === "general"
                ? "text-white border-white"
                : "text-neutral-400 border-transparent hover:text-neutral-300"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              activeTab === "transcript"
                ? "text-white border-white"
                : "text-neutral-400 border-transparent hover:text-neutral-300"
            }`}
          >
            Transcript
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              activeTab === "code"
                ? "text-white border-white"
                : "text-neutral-400 border-transparent hover:text-neutral-300"
            }`}
          >
            Code
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Report;
