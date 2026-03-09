import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Session from "./Session";
import "./App.css";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/session" element={<Session />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
