import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { startOAuthFlow, OAuthProvider } from "./oauth";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthClick = async (provider: OAuthProvider) => {
    try {
      setLoading(provider);
      setError(null);

      await startOAuthFlow(provider);

      // The OAuth flow will continue in the system browser
      // and callback will be handled by the deep link listener
    } catch (err) {
      console.error("OAuth init error:", err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to start ${provider} sign in. Please try again.`
      );
      setLoading(null);
    }
  };

  if (user) {
    navigate("/home");
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a10] p-5">
      <div className="w-full max-w-[400px] text-center">
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">AlgoVox</h1>
        <p className="text-base text-gray-400 mb-12">Master technical interviews with AI</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-[#3c4043] border border-[#2a2a38] rounded-[10px] text-base font-medium hover:bg-[#f8f9fa] hover:border-[#dadce0] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            onClick={() => handleOAuthClick("google")}
            disabled={loading !== null}
          >
            {loading === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loading === "google" ? "Connecting..." : "Continue with Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
