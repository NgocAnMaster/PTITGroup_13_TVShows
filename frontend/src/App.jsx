import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import ShowDetail from "./pages/ShowDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Stats from "./pages/Stats";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-black min-h-screen">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/shows/:id" element={<ShowDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}