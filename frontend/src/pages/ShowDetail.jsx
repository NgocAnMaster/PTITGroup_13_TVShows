import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

export default function ShowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchShow();
    fetchReviews();
  }, [id]);

  async function fetchShow() {
    const res = await fetch(`${API_URL}/shows/${id}`);
    const data = await res.json();
    setShow(data);
  }

  async function fetchReviews() {
    const res = await fetch(`${API_URL}/ratings/${id}`);
    const data = await res.json();
    setReviews(data);
  }

  if (!show) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="p-6 text-white">
      {/* ⬅️ BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span>←</span> Back to list
      </button>

      {/* 🎬 HEADER */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Poster (placeholder) */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-800 h-[400px] rounded-2xl flex items-center justify-center text-gray-400">
            <img
              src="https://placehold.co/270x400?text=No+Poster"
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{show.name}</h1>
          <p className="opacity-70">{show.original_name}</p>

          <div className="mt-2 text-yellow-400 text-lg">
            ⭐ {show.vote_average?.toFixed(1)} ({show.vote_count} votes)
          </div>

          <div className="mt-2 text-sm opacity-70">
            {show.genres?.join(", ")}
          </div>

          <div className="mt-2 text-sm opacity-70">
            First Air: {show.first_air_date}
          </div>

          <div className="mt-2 text-sm opacity-70">
            Seasons: {show.num_seasons} | Episodes: {show.num_episodes}
          </div>
        </div>
      </div>

      {/* 🎥 TRAILER */}
      {show.trailer && (
        <div className="mt-8">
          <h2 className="text-xl mb-2">🎥 Trailer</h2>
          <video
            controls
            className="w-full rounded-xl"
            src={show.trailer}
          />
        </div>
      )}

      {/* ⭐ REVIEWS */}
      <div className="mt-10">
        <h2 className="text-xl mb-4">⭐ User Reviews</h2>

        {reviews.length === 0 && (
          <p className="text-gray-400">No reviews yet.</p>
        )}

        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="bg-gray-900 p-4 rounded-xl">
              <div className="text-yellow-400">
                ⭐ {r.rating.toFixed(1)}
              </div>
              <p className="mt-2 text-sm">{r.review}</p>
              <div className="text-xs opacity-50 mt-2">
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}