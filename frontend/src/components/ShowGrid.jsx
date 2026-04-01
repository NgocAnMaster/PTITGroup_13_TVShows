import ShowCard from "./ShowCard";

export default function ShowGrid({ shows }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {shows.map((s) => (
        <ShowCard key={s._id} show={s} />
      ))}
    </div>
  );
}