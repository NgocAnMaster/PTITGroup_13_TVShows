import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import axios from "axios";
import api from "../api/api.js"

export default function Stats() {
    const { user } = useAuth();
    const [data, setData] = useState({
        summary: null,
        genres: [],
        gems: [],
        loading: true,
        error: null
    });

    // 1. Protection Logic
    if (!user) return <Navigate to="/login" />;
    if (user.role !== "admin" && user.role !== "staff") {
        return <div className="text-white p-10 text-center text-2xl">🚫 Unauthorized Access</div>;
    }

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Assuming you use axios and have configured it to send tokens
                const [summaryRes, genreRes, gemsRes] = await Promise.all([
                    api.get("/stats/summary"),
                    api.get("/stats/genres"),
                    api.get("/stats/hidden-gems")
                ]);

                setData({
                    summary: summaryRes.data[0],
                    genres: genreRes.data,
                    gems: gemsRes.data,
                    loading: false,
                    error: null
                });
            } catch (err) {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setData(prev => ({ ...prev, loading: false, error: "Unauthorized access." }));
                } else {
                    setData(prev => ({ ...prev, loading: false, error: "Failed to load stats." }));
                }
            }
        };

        fetchStats();
    }, []);

    if (data.loading) return <div className="p-10 text-white">Calculating metrics...</div>;
    if (data.error) return <div className="p-10 text-red-500">{data.error}</div>;

    const { summary, genres, gems } = data;

    return (
        <div className="p-8 text-white max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500">
                    <p className="text-gray-400 text-sm uppercase">Avg. Popularity</p>
                    <h2 className="text-4xl font-bold">{summary?.average_popularity[0]?.avg.toFixed(2)}</h2>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-green-500">
                    <p className="text-gray-400 text-sm uppercase">Avg. Show Votes</p>
                    <h2 className="text-4xl font-bold">
                        {summary?.average_show_votes[0]?.avg.toFixed(2)}
                    </h2>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-purple-500">
                    <p className="text-gray-400 text-sm uppercase">Top Genre</p>
                    <h2 className="text-4xl font-bold">{summary?.top_genres[0]?._id}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Genre Breakdown Table */}
                <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 text-blue-400">Genre Performance</h3>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                <th className="pb-2">Genre</th>
                                <th className="pb-2">Count</th>
                                <th className="pb-2">Avg Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {genres.slice(0, 8).map(g => (
                                <tr key={g._id} className="border-b border-gray-700/50">
                                    <td className="py-3">{g._id}</td>
                                    <td className="py-3">{g.count}</td>
                                    <td className="py-3 text-yellow-500">⭐ {g.avgRating.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Hidden Gems List */}
                <div className="bg-gray-800 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 text-green-400">Hidden Gems</h3>
                    <div className="space-y-4">
                        {gems.map(show => (
                            <div key={show._id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                                <div>
                                    <p className="font-medium">{show.name}</p>
                                    <p className="text-xs text-gray-500">Popularity: {show.popularity}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded">
                                        ⭐ {show.vote_average}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}