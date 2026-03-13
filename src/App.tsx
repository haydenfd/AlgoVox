import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Login from "./Login";
import Home from "./Home";
import Session from "./Session";
import Report from "./Report";
import "./App.css";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/session" element={<Session />} />
          <Route path="/report/:id" element={<Report />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
