import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { searchShows } from "../api/api";
import ShowGrid from "../components/ShowGrid";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read target search term directly from the URL query parameters
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Sync state if a user types into the address bar or triggers browser back-tracking
  useEffect(() => {
    setQuery(urlQuery);
    if (urlQuery.trim()) {
      executeSearch(urlQuery);
    } else {
      setResults([]);
    }
  }, [urlQuery]);

  // Handle clicking outside the suggestion area to dismiss overlay
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Updates the URL query parameters. useSearchParams automatically handles escaping special characters 
  // and encoding spaces cleanly to '+' (or %20) safely out-of-the-box.
  const updateUrlQuery = (searchTerm) => {
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm });
    } else {
      setSearchParams({});
    }
  };

  async function executeSearch(targetQuery) {
    try {
      const data = await searchShows(targetQuery);
      setResults(data || []);
    } catch (err) {
      console.error("Search execution failed:", err);
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    updateUrlQuery(query);
  };

  // Keyword-Completion Engine (fetches matches and chunks variations up to max 10 suggestions)
  const handleInputChange = async (value) => {
    setQuery(value);
    const cleanValue = value.trim().toLowerCase();

    if (!cleanValue) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      const matchedShows = await searchShows(cleanValue);
      
      if (matchedShows && matchedShows.length > 0) {
        const uniqueKeywords = new Set();
        
        for (const show of matchedShows) {
          const name = show.name || "";
          const origName = show.original_name || "";
          
          if (name.toLowerCase().includes(cleanValue)) uniqueKeywords.add(name);
          if (origName && origName.toLowerCase().includes(cleanValue)) uniqueKeywords.add(origName);

          // Chunk phrases down into sub-keywords for richer auto-complete options
          const phraseWords = name.split(/\s+/);
          for (let i = 0; i < phraseWords.length; i++) {
            const subPhrase = phraseWords.slice(i, i + 3).join(" ");
            if (subPhrase.toLowerCase().includes(cleanValue)) {
              uniqueKeywords.add(subPhrase.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
            }
          }
          if (uniqueKeywords.size >= 15) break;
        }

        // Filter and cap strictly at 10 items
        const cleanList = Array.from(uniqueKeywords)
          .filter(kw => kw.toLowerCase().includes(cleanValue))
          .slice(0, 10);

        setSuggestions(cleanList);
        setShowDropdown(cleanList.length > 0);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error("Failed to compile search suggestions:", err);
    }
  };

  const handleSelectSuggestion = (suggestedTerm) => {
    setQuery(suggestedTerm);
    setShowDropdown(false);
    updateUrlQuery(suggestedTerm);
  };

  return (
    <div className="p-6 text-white max-w-6xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">🔍 Search Shows</h1>

      {/* ADJUSTED SEARCH BOX & INTERFACE */}
      <div className="relative max-w-2xl mb-8" ref={dropdownRef}>
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="p-3 w-full text-white bg-gray-900 rounded-xl border border-gray-800 outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-10 text-base shadow-inner shadow-black/40"
              placeholder="Search movies or TV shows..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => query.trim() && suggestions.length > 0 && setShowDropdown(true)}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSuggestions([]); setResults([]); setSearchParams({}); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* SEARCH BUTTON BUTTON (Functions the same as pressing "Enter") */}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 font-bold rounded-xl transition-all shadow-md shadow-blue-900/20 flex items-center gap-1.5 text-base"
          >
            <span>Search</span>
          </button>
        </form>

        {/* RECOMMENDATION SUGGESTIONS OVERLAY (Max 10 items) */}
        {showDropdown && (
          <div className="absolute left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md max-h-72 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white border-b border-gray-800/40 last:border-0 transition-colors flex items-center gap-2 font-medium"
              >
                <span className="text-gray-500 text-xs">✨</span>
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RESULTS GRID */}
      <div>
        {urlQuery && results.length > 0 && (
          <p className="text-gray-400 text-sm mb-4">
            Showing results for <span className="text-blue-400 font-semibold">"{urlQuery}"</span> ({results.length} found)
          </p>
        )}
        
        {urlQuery && results.length === 0 && (
          <div className="text-center py-16 bg-gray-900/20 rounded-2xl border border-dashed border-gray-800 p-8">
            <p className="text-gray-400 text-lg">No matches found for "{urlQuery}"</p>
          </div>
        )}

        <ShowGrid shows={results} />
      </div>
    </div>
  );
}