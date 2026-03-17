import { HashRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import Home from "./Home";
import Session from "./Session";
import Report from "./Report";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/session" element={<Session />} />
        <Route path="/report/:id" element={<Report />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
