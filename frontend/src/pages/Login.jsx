import { useState } from "react";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await login(form);
            loginUser(res.data);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl mb-4 text-white">Login</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    placeholder="Username"
                    className="p-2 rounded"
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="p-2 rounded"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <button className="bg-blue-500 text-white p-2 rounded">Login</button>

                {/* Polished Error Message Div */}
                {error && (
                    <div className="mt-2 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm">
                        <div className="flex items-center gap-2">
                            <span>⚠️</span>
                            {error}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}