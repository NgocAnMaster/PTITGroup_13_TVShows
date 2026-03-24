export default function ShowCard({ show }) {
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-3 shadow">
      <h3 className="text-lg font-bold">{show.name}</h3>
      <p className="text-sm opacity-70">{show.original_name}</p>

      <div className="mt-2 text-yellow-400">
        ⭐ {show.vote_average?.toFixed(1)} ({show.vote_count})
      </div>

      <div className="text-xs mt-1 opacity-60">
        {show.genres?.join(", ")}
      </div>
    </div>
  );
}