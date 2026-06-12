import { Link } from "react-router-dom";
export default function ShowCard({ show }) {
  return (
    <Link to={`/shows/${show._id}`}>
      <div className="bg-gray-900 text-white rounded-2xl p-3 shadow">
        <img 
            src={show.poster_path || "https://placehold.co/200x300?text=No+Image"} 
            className="w-full h-64 rounded-2xl object-cover"
            alt={show.name}
        />
        <h3 className="text-lg font-bold">{show.name}</h3>
        <p className="text-sm opacity-70">{show.original_name}</p>

        <div className="mt-2 text-yellow-400">
          ⭐ {show.vote_average?.toFixed(1)} ({show.vote_count})
        </div>

        <div className="text-xs mt-1 opacity-60">
          {show.genres?.join(", ")}
        </div>
      </div>
    </Link>
  );
}