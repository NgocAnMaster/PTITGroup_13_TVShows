import { useEffect, useState, useRef } from "react";
import { fetchShows } from "../api/api";
import ShowGrid from "../components/ShowGrid";
import Loader from "../components/Loader";

export default function Home() {
  const [shows, setShows] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const observer = useRef();

  useEffect(() => {
    loadShows();
  }, [page]);

  async function loadShows() {
    setLoading(true);
    const data = await fetchShows(page);
    setShows((prev) => [...prev, ...data]);
    setLoading(false);
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

  return (
    <div className="p-4">
      <h1 className="text-2xl text-white mb-4">🔥 Popular Shows</h1>

      <ShowGrid shows={shows} />

      <div ref={lastElementRef}></div>

      {loading && <Loader />}
    </div>
  );
}