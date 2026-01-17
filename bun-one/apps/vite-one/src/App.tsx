import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import "./index.css";

function App() {
  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 p-4 bg-white/10 backdrop-blur z-50 flex justify-center gap-6 shadow-sm">
        <Link
          to="/"
          className="text-white font-bold hover:text-blue-200 transition-colors"
        >
          Home
        </Link>
        <Link
          to="/about"
          className="text-white font-bold hover:text-blue-200 transition-colors"
        >
          About
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

export default App;
