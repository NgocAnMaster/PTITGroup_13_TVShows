const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getShowCollection } = require("../models/Show");

// router.get("/genres", async (req, res) => {
//   const collection = getShowCollection();

//   const stats = await collection.aggregate([
//     { $unwind: "$genres" },
//     {
//       $group: {
//         _id: "$genres",
//         count: { $sum: 1 },
//         avgRating: { $avg: "$vote_average" }
//       }
//     },
//     { $sort: { count: -1 } }
//   ]).toArray();

//   res.json(stats);
// });

// router.get("/hidden-gems", async (req, res) => {
//   const collection = getShowCollection();

//   const gems = await collection.find({
//     vote_average: { $gt: 8 },
//     popularity: { $lt: 50 },
//     vote_count: { $gt: 10 }
//   }).sort({ vote_average: -1 }).limit(10).toArray();

//   res.json(gems);
// });

// Genre popularity & rating
router.get('/genres', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const stats = await collection.aggregate([
        { $unwind: "$genres" },
        {
            $group: {
                _id: "$genres",
                count: { $sum: 1 },
                avgRating: { $avg: "$vote_average" }
            }
        },
        { $sort: { count: -1 } }
    ]).toArray();
    res.json(stats);
});

// Yearly Release Trends
router.get('/trends', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const stats = await collection.aggregate([
        { $project: { year: { $substr: ["$first_air_date", 0, 4] } } },
        { $match: { year: { $ne: "" } } },
        { $group: { _id: "$year", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).toArray();
    res.json(stats);
});

// Content "Hidden Gems" (High rating, low popularity)
router.get('/hidden-gems', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const gems = await collection.find({
        vote_average: { $gt: 8 },
        popularity: { $lt: 50 },
        vote_count: { $gt: 10 }
    }).sort({ vote_average: -1 }).limit(10).toArray();
    res.json(gems);
});

// 1. Average Vote by Genre
router.get('/rating-by-genre', auth("staff"), async (req, res) => {
    try {
        const collection = getShowCollection();
        const stats = await collection.aggregate([
            { $unwind: "$genres" },
            {
                $group: {
                    _id: "$genres",
                    avgRating: { $avg: "$vote_average" },
                    count: { $sum: 1 }
                }
            },
            // Use $match to filter the aggregated results
            { $match: { count: { $gt: 5 } } },
            { $sort: { avgRating: -1 } }
        ]).toArray();

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Yearly Trends (Releases per year)
router.get('/yearly-trends', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const trends = await collection.aggregate([
        { $project: { year: { $substr: ["$first_air_date", 0, 4] } } },
        { $group: { _id: "$year", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]).toArray();
    res.json(trends);
});

// 3. Vietnam Availability Ratio
router.get('/availability', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const avail = await collection.aggregate([
        { $group: { _id: "$available_in_vietnam", count: { $sum: 1 } } }
    ]).toArray();
    res.json(avail);
});

// Statistics: Popularity vs Rating Correlation
router.get('/hot-takes', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    // Finds shows with high popularity but low ratings (The "Controversial" shows)
    const stats = await collection.find({
        popularity: { $gt: 50 },
        vote_average: { $lt: 5 }
    }).sort({ popularity: -1 }).limit(10).toArray();
    res.json(stats);
});

// Statistics: Language Distribution
router.get('/languages', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const stats = await collection.aggregate([
        { $unwind: "$languages" },
        { $group: { _id: "$languages", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]).toArray();
    res.json(stats);
});

router.get('/summary', auth("staff"), async (req, res) => {
    const collection = getShowCollection();
    const summary = await collection.aggregate([
        {
            $facet: {
                "top_genres": [
                    { $unwind: "$genres" },
                    { $group: { _id: "$genres", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ],
                "average_popularity": [
                    { $group: { _id: null, avg: { $avg: "$popularity" } } }
                ],
                "vietnam_market_share": [
                    { $group: { _id: "$available_in_vietnam", count: { $sum: 1 } } }
                ]
            }
        }
    ]).toArray();
    res.json(summary);
});

// 👉 add others similarly (you already wrote them well)

module.exports = router;