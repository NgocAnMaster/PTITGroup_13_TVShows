import { useState } from "react";
import { searchShows } from "../api/api";
import ShowGrid from "../components/ShowGrid";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  async function handleSearch(e) {
    e.preventDefault();
    const data = await searchShows(query);
    setResults(data);
  }

  return (
    <div className="p-4 text-white">
      <form onSubmit={handleSearch} className="mb-4">
        <input
          className="p-2 w-full text-black rounded"
          placeholder="Search movies or TV shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <ShowGrid shows={results} />
    </div>
  );
}