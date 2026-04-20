import { useState } from "react";
import { register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import countries from "../data/countries.json";

export default function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        country: ""
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();

    const validateForm = () => {
        // 1. All fields required
        if (!form.username || !form.email || !form.password || !form.country || !confirmPassword) {
            return "All fields are required.";
        }

        // 2. Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            return "Please enter a valid email address.";
        }

        // 3. Password strength: 8+ chars, letters and numbers
        // Regex: (?=.*[a-zA-Z]) (at least one letter) (?=.*[0-9]) (at least one number)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(form.password)) {
            return "Password must be at least 8 characters long and include both letters and numbers.";
        }

        // 4. Password match
        if (form.password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return null; // No errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        try {
            await register(form);
            setSuccess("Registered! Please login.");
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Register failed");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl mb-4 text-white">Register</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    placeholder="Username"
                    className="p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                />

                <input
                    placeholder="Email"
                    type="email"
                    className="p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <select
                    className="p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>

                <input
                    type="password"
                    placeholder="Password"
                    className="p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded font-bold transition-colors mt-2">
                    Register
                </button>

                {error && (
                    <div className="mt-2 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm">
                        <div className="flex items-center gap-2">
                            <span>⚠️</span>
                            {error}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mt-2 p-3 rounded-lg bg-green-100 border border-green-400 text-green-700 text-sm">
                        <div className="flex items-center gap-2">
                            <span>✅</span>
                            {success}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}