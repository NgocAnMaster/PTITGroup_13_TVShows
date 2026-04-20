import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, logoutUser } = useAuth();

    // Helper for active styling
    const activeLink = ({ isActive }) => 
        isActive ? "text-blue-400 font-medium" : "hover:text-gray-300 transition-colors";

    // Permission Check
    const canSeeStats = user && (user.role === "admin" || user.role === "staff");

    return (
        <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
            {/* Left Side: Navigation Links */}
            <div className="flex gap-6">
                <Link to="/" className="font-bold text-xl mr-2">🎬 TV Shows</Link>
                
                {/* end prop ensures Home isn't highlighted when on other pages */}
                <NavLink to="/" end className={activeLink}>
                    Home
                </NavLink>
                
                <NavLink to="/search" className={activeLink}>
                    Search
                </NavLink>

                {/* Condition Link for Stats */}
                {canSeeStats && (
                    <NavLink to="/stats" className={activeLink}>Dashboard</NavLink>
                )}
            </div>

            {/* Right Side: Auth Links */}
            <div className="flex gap-4 items-center">
                {user ? (
                    <>
                        <span className="text-gray-300">{user.username}</span>
                        <button
                            onClick={logoutUser}
                            className="hover:text-red-400 transition-colors"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register" className="bg-blue-600 px-3 py-1 rounded">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}