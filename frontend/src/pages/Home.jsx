import { useEffect, useState, useRef } from "react";
import { fetchShows, fetchRecommendations } from "../api/api";
import { useAuth } from "../context/AuthContext";
import ShowGrid from "../components/ShowGrid";
import Loader from "../components/Loader";

export default function Home() {
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state
  const [shows, setShows] = useState([]);
  const [recommendations, setRecommendations] = useState([]); // State for "For You"
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  const observer = useRef();

  useEffect(() => {
    loadShows();
  }, [page]);

  // 2. Fetch Recommendations (Only if logged in)
  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  async function loadShows() {
    setLoading(true);
    const data = await fetchShows(page);
    setShows((prev) => [...prev, ...data]);
    setLoading(false);
  }

  async function loadRecommendations() {
    setRecLoading(true);
    try {
      const data = await fetchRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    } finally {
      setRecLoading(false);
    }
  }

  const lastElementRef = (node) => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  };

  if (authLoading) {
    return <div className="p-10 text-white">Verifying session...</div>;
  }

  return (
    <div className="p-4 space-y-10">
      {/* ✨ FOR YOU SECTION */}
      {user && (
        <section>
          <h2 className="text-2xl text-blue-400 font-bold mb-4 flex items-center gap-2">
            ✨ For You, {user.username}
          </h2>
          {recLoading ? (
            <Loader />
          ) : recommendations.length > 0 ? (
            <ShowGrid shows={recommendations} />
          ) : (
            <p className="text-gray-500 italic">Watch more shows to get personalized recommendations!</p>
          )}
          <hr className="mt-10 border-gray-800" />
        </section>
      )}

      {/* 🔥 POPULAR SHOWS SECTION */}
      <section>
        <h1 className="text-2xl text-white font-bold mb-4">🔥 Popular Shows</h1>
        <ShowGrid shows={shows} />
        
        {/* Intersection Anchor */}
        <div ref={lastElementRef} className="h-10"></div>

        {loading && <Loader />}
      </section>
    </div>
  );
}