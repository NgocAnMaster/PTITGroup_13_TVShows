import { useEffect, useState, useCallback, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function History() {
    const { user, sessionLoading } = useAuth();
    const [items, setItems] = useState([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // 💡 The Fix: Tracking variable that survives re-renders but doesn't trigger them
    const isFetching = useRef(false);
    const limit = 10;

    const fetchHistory = useCallback(async () => {
        // if (loading || !hasMore) return;
        // If we are already fetching or have no more data, stop immediately
        if (isFetching.current || !hasMore) return;
        
        isFetching.current = true; // Lock the fetch
        setLoading(true);
        try {
            const res = await api.get(`/users/history?skip=${skip}&limit=${limit}`);
            if (res.data.length < limit) setHasMore(false);
            if (res.data.length > 0) {
                setItems(prev => [...prev, ...res.data]);
                setSkip(prev => prev + limit);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    }, [skip, loading, hasMore]);

    useEffect(() => {
        fetchHistory();
    }, []);

    // Scroll listener logic
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
                fetchHistory();
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [fetchHistory, loading]);

    if (sessionLoading) {
        return <div className="p-10 text-white">Verifying session...</div>;
    }
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="p-6 text-white max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Watching History</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((show, index) => (
                    <Link to={`/shows/${show._id}`} key={`${show._id}-${index}`} className="group">
                        <div className="bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                            <img 
                                src={show.poster_path || "https://placehold.co/200x300?text=No+Image"} 
                                className="w-full h-64 object-cover"
                                alt={show.name}
                            />
                            <div className="p-2">
                                <h3 className="text-sm font-semibold truncate">{show.name}</h3>
                                <p className="text-[10px] text-gray-500 uppercase">
                                    Last seen: {new Date(show.lastViewed).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {loading && <div className="text-center py-4">Loading more...</div>}
            {!hasMore && items.length > 0 && <div className="text-center py-4 text-gray-500">End of history</div>}
            {items.length === 0 && !loading && <p className="text-center text-gray-400">No history found.</p>}
        </div>
    );
}