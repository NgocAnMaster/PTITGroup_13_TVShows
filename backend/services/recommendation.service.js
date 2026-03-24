const { ObjectId } = require("mongodb");
const { getRatingCollection } = require("../models/Rating");
const { getShowCollection } = require("../models/Show");

async function getUserPreferences(userId) {
    const ratings = getRatingCollection();

    const data = await ratings.aggregate([
        {
            $match: {
                userId: new ObjectId(userId),
                rating: { $gte: 5 } // only liked content
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

    return data.slice(0, 5).map(g => g._id);
}


async function getContentBasedRecommendations(userId, limit = 20) {
    const ratings = getRatingCollection();
    const shows = getShowCollection();

    const preferredGenres = await getUserPreferences(userId);

    if (preferredGenres.length === 0) {
        // fallback: popular shows
        return await shows.find({
            vote_count: { $gt: 50 }
        })
            .sort({ popularity: -1, vote_average: -1 })
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

// 🧠 Find similar users
async function getSimilarUsers(userId) {
    const ratings = getRatingCollection();

    // Get current user's liked shows
    const myRatings = await ratings.find({
        userId: new ObjectId(userId),
        rating: { $gte: 5 }
    }).toArray();

    const showIds = myRatings.map(r => r.showId);

    console.log("User liked shows:", showIds.length);
    if (showIds.length === 0) return [];

    // Find other users who liked same shows
    const similar = await ratings.aggregate([
        {
            $match: {
                showId: { $in: showIds },
                rating: { $gte: 5 },
                userId: { $ne: new ObjectId(userId) }
            }
        },
        {
            $group: {
                _id: "$userId",
                score: { $sum: "$rating" } // overlap count
                // score: { $sum: 1 } // overlap count
            }
        },
        { $sort: { score: -1 } },
        { $limit: 100 }
    ]).toArray();

    return similar.map(u => u._id);
}

async function getCollaborativeRecommendations(userId, limit = 20) {
    const ratings = getRatingCollection();
    const shows = getShowCollection();

    const similarUsers = await getSimilarUsers(userId);

    console.log("Similar users:", similarUsers.length);
    if (similarUsers.length === 0) {
        // return []; // fallback handled outside
        return await getContentBasedRecommendations(userId, limit);
    }

    // Get current user's watched shows
    const myRatings = await ratings.find({
        userId: new ObjectId(userId)
    }).project({ showId: 1 }).toArray();

    const watchedIds = myRatings.map(r => r.showId);

    // Get shows liked by similar users
    const recs = await ratings.aggregate([
        {
            $match: {
                userId: { $in: similarUsers },
                rating: { $gte: 5 }
            }
        },
        {
            $group: {
                _id: "$showId",
                score: { $sum: 1 }
            }
        },
        {
            $match: {
                _id: { $nin: watchedIds }
            }
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "shows",
                localField: "_id",
                foreignField: "_id",
                as: "show"
            }
        },
        { $unwind: "$show" },
        {
            $replaceRoot: { newRoot: "$show" }
        }
    ]).toArray();

    return recs;
}

async function getRecommendations(userId, limit = 20) {
    // 🔥 Try collaborative first
    const collaborative = await getCollaborativeRecommendations(userId, limit);

    if (collaborative.length >= 10) {
        return collaborative;
    }

    // 🟡 fallback → content-based (your old method)
    const contentBased = await getContentBasedRecommendations(userId, limit);

    return contentBased;
}

module.exports = { getRecommendations, getCollaborativeRecommendations };