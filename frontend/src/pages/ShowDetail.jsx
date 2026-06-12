import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api"
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3000";

export default function ShowDetail() {
  const { id } = useParams();
  const { user, sessionLoading } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  // 🔄 Review & Pagination States
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 5; // Load in chunks of 5

  // 🛠 Sorting State
  const [sortConfig, setSortConfig] = useState({ sortBy: "createdAt", order: "desc" });

  // States for creating/editing
  const [newReview, setNewReview] = useState({ rating: 5, review: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, review: "" });

  const isFetching = useRef(false);

  // 1. Fetch Show Details
  async function fetchShow() {
    const res = await api.get(`/shows/${id}`);
    setShow(res.data);
  }

  // 2. Optimized Review Fetcher (Handles Pagination & Sorting)
  const fetchReviews = useCallback(async (reset = false) => {
    if (isFetching.current || (!hasMore && !reset)) return;

    isFetching.current = true;
    loadingReviews(true);
    const currentSkip = reset ? 0 : skip;

    try {
      const res = await api.get(`/ratings/${id}`, {
        params: {
          limit,
          skip: currentSkip,
          sortBy: sortConfig.sortBy,
          order: sortConfig.order
        }
      });

      if (reset) {
        setReviews(res.data);
        setSkip(limit);
        setHasMore(res.data.length === limit);
      } else {
        setReviews(prev => [...prev, ...res.data]);
        setSkip(prev => prev + limit);
        setHasMore(res.data.length === limit);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoadingReviews(false);
      isFetching.current = false;
    }
  }, [id, skip, hasMore, sortConfig]);

  // Initial Load & History
  useEffect(() => {
    fetchShow();
    if (user) {
      api.post(`/users/history/${id}`).catch(err => console.error("History error", err));
    }
  }, [id, user]);

  // Trigger reset fetch whenever sort changes
  useEffect(() => {
    fetchReviews(true);
  }, [sortConfig]);

  // 3. Infinite Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loadingReviews && hasMore) {
        fetchReviews();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchReviews, loadingReviews, hasMore]);

  // --- Handlers ---

  const handleAddOrUpdateReview = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        showId: id,
        rating: Number(newReview.rating),
        review: newReview.review
      };

      await api.post(`/ratings`, payload);

      setNewReview({ rating: 5, review: "" });
      fetchReviews(true);
      fetchShow(); // Refresh aggregated score on header
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error saving review");
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setEditForm({ rating: r.rating, review: r.review });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        showId: id,
        rating: Number(editForm.rating),
        review: editForm.review
      };

      await api.post(`/ratings`, payload);

      setEditingId(null);
      fetchReviews(true);
      fetchShow();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/ratings/${reviewId}`);
      fetchReviews(true);
      fetchShow();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (sessionLoading) {
    return <div className="p-10 text-white">Verifying session...</div>;
  }

  if (!show) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      {/* ⬅️ BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>←</span> Back to list
      </button>

      {/* 🎬 HEADER */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">

        {/* Poster */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-800 h-[400px] rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden shadow-lg shadow-black/30">
            <img
              src={show.poster_path || "https://placehold.co/270x400?text=No+Poster"}
              className="w-full h-full object-cover"
              alt={show.name}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{show.name}</h1>
              {show.type && (
                <span className="bg-gray-800 text-gray-400 text-xs uppercase px-2 py-0.5 rounded font-mono font-bold tracking-wider border border-gray-700">
                  {show.type}
                </span>
              )}
            </div>
            <p className="opacity-60 text-sm italic">{show.original_name}</p>
          </div>

          <div className="text-yellow-400 text-lg font-semibold flex items-center gap-2">
            ⭐ {show.vote_average?.toFixed(1)} 
            <span className="text-sm text-gray-400">({show.vote_count} votes)</span>
          </div>

          {show.genres && show.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {show.genres.map((genre, idx) => (
                <span key={idx} className="bg-blue-900/40 text-blue-300 text-xs px-2.5 py-1 rounded-full border border-blue-800/50">
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-300 space-y-1 font-medium pt-2">
            {show.release_date && (
              <div><span className="text-gray-500">Release Date:</span> {show.release_date}</div>
            )}
            {show.runtime > 0 && (
              <div><span className="text-gray-500">Runtime:</span> {show.runtime} mins</div>
            )}
            {show.num_seasons > 0 && (
              <div><span className="text-gray-500">Seasons:</span> {show.num_seasons} | <span className="text-gray-500">Episodes:</span> {show.num_episodes}</div>
            )}
          </div>

          {/* 📝 OVERVIEW SECTION */}
          {show.overview && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Overview</h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl bg-gray-900/30 p-3 rounded-xl border border-gray-800">
                {show.overview}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🎥 TRAILER */}
      {show.trailer_url && (
        <div className="mt-8">
          <h2 className="text-xl mb-4 font-bold border-b border-gray-800 pb-2">🎥 Trailer</h2>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl shadow-black/60 border border-gray-800 bg-black">
            {show.trailer_url.includes("youtube.com") || show.trailer_url.includes("youtu.be") ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${show.trailer_url.split("v=")[1]?.split("&")[0] || show.trailer_url.split("/").pop()}`}
                title={`${show.name} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                controls
                className="w-full h-full"
                src={show.trailer_url}
              />
            )}
          </div>
        </div>
      )}

      {/* ⭐ REVIEWS */}
      <div className="mt-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold">⭐ User Reviews</h2>

          {/* 🛠 SORTING CONTROLS */}
          <div className="flex gap-2">
            <select
              className="bg-gray-800 p-2 rounded text-sm border border-gray-700 outline-none focus:ring-1 ring-blue-500"
              value={sortConfig.sortBy}
              onChange={(e) => setSortConfig(prev => ({ ...prev, sortBy: e.target.value }))}
            >
              <option value="createdAt">Sort by: Date</option>
              <option value="rating">Sort by: Stars</option>
            </select>

            <select
              className="bg-gray-800 p-2 rounded text-sm border border-gray-700 outline-none focus:ring-1 ring-blue-500"
              value={sortConfig.order}
              onChange={(e) => setSortConfig(prev => ({ ...prev, order: e.target.value }))}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* ✍️ ADD REVIEW SECTION */}
        {user ? (
          <div className="bg-gray-800/50 p-6 rounded-xl mb-10 border border-gray-700">
            <h3 className="font-bold mb-4">Leave your rating</h3>
            <form onSubmit={handleAddOrUpdateReview} className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-400">Rating (1-10):</label>
                <input type="number" min="1" max="10" step="any" className="bg-gray-900 p-2 rounded w-20 text-center font-bold text-yellow-400 border border-gray-700"
                  value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: e.target.value })} />
              </div>
              <textarea className="w-full bg-gray-900 p-3 rounded-lg h-24 outline-none focus:ring-1 ring-blue-500 border border-gray-700" placeholder="Write your thoughts about this show..."
                value={newReview.review} onChange={e => setNewReview({ ...newReview, review: e.target.value })} />
              <button className="bg-blue-600 px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all">Submit Review</button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800/30 p-4 rounded-xl mb-10 text-center border border-dashed border-gray-700">
            <p className="text-gray-400">Please <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/login')}>login</span> to review this show.</p>
          </div>
        )}

        {reviews.length === 0 && (
          <p className="text-gray-400">No reviews yet.</p>
        )}

        <div className="space-y-6">
          {reviews.map((r) => {
            const currentUserId = user?.id || user?._id;
            const reviewOwnerId = r.userId;

            const isOwner = currentUserId && reviewOwnerId && String(currentUserId) === String(reviewOwnerId);
            const isPrivileged = user && (user.role === "admin" || user.role === "staff");
            const canManage = isOwner || isPrivileged;

            return (
              <div key={r._id} className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
                {editingId === r._id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <input type="number" min="1" max="10" step="any" className="bg-gray-800 p-2 rounded font-bold text-yellow-400"
                      value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: e.target.value })} />
                    <textarea className="w-full bg-gray-800 p-3 rounded-lg h-20"
                      value={editForm.review} onChange={e => setEditForm({ ...editForm, review: e.target.value })} />
                    <div className="flex gap-3">
                      <button className="bg-green-600 px-4 py-1 rounded text-sm font-bold">Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 text-sm">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-yellow-400 font-bold text-lg">⭐ {r.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-gray-500 font-mono mt-1 uppercase">
                          {new Date(r.createdAt).toLocaleDateString()} at {new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {canManage && (
                        <div className="flex gap-3 opacity-100 group-hover:opacity-50 transition-opacity">
                          {(isOwner || isPrivileged) && (
                            <button onClick={() => startEdit(r)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold">Edit</button>
                          )}
                          <button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-400 text-xs font-semibold">Delete</button>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-gray-300 leading-relaxed">{r.review}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}