const { ObjectId } = require("mongodb");
const { getRatingCollection } = require("../models/Rating");
const { getShowCollection } = require("../models/Show");

async function getUserPreferences(userId) {
  const ratings = getRatingCollection();

  const data = await ratings.aggregate([
    {
      $match: {
        userId: new ObjectId(userId),
        rating: { $gte: 7 } // only liked content
      }
    },
    {
      $lookup: {
        from: "shows",
        localField: "showId",
        foreignField: "_id",
        as: "show"
      }
    },
    { $unwind: "$show" },
    { $unwind: "$show.genres" },
    {
      $group: {
        _id: "$show.genres",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  return data.map(g => g._id);
}


async function getRecommendations(userId, limit = 20) {
  const ratings = getRatingCollection();
  const shows = getShowCollection();

  const preferredGenres = await getUserPreferences(userId);

  if (preferredGenres.length === 0) {
    // fallback: popular shows
    return await shows.find({})
      .sort({ popularity: -1 })
      .limit(limit)
      .toArray();
  }

  // get watched shows
  const watched = await ratings.find({
    userId: new ObjectId(userId)
  }).project({ showId: 1 }).toArray();

  const watchedIds = watched.map(w => w.showId);

  // recommend similar shows
  const recs = await shows.find({
    genres: { $in: preferredGenres },
    _id: { $nin: watchedIds }
  })
    .sort({ popularity: -1, vote_average: -1 })
    .limit(limit)
    .toArray();

  return recs;
}

module.exports = { getRecommendations };