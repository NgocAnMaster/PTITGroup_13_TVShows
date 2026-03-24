import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import ShowDetail from "./pages/ShowDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-black min-h-screen">
        <nav className="p-4 flex gap-4 text-white">
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/shows/:id" element={<ShowDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}