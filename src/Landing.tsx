import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-6">AlgoVox</h1>
        <p className="text-neutral-400 mb-8">AI-powered coding interview practice</p>
        <button
          onClick={() => navigate("/home")}
          className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default Landing;
