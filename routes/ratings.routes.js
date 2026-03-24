const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

const { getRatingCollection } = require("../models/Rating");
const { getShowCollection } = require("../models/Show");


// ⭐ Add / Update rating
router.post("/", auth(["user", "admin"]), async (req, res) => {
    try {
        const { userId, showId, rating, review } = req.body;

        if (rating < 1 || rating > 10) {
            return res.status(400).json({ error: "Invalid rating" });
        }

        const ratings = getRatingCollection();
        const shows = getShowCollection();

        ratings.createIndex({ userId: 1, showId: 1 }, { unique: true });

        const existing = await ratings.findOne({ userId, showId });

        if (req.user.role === "user" && existing.userId !== req.user.id) {
            return res.status(403).json({ error: "Not allowed to edit this review" });
        }

        if (existing) {
            await ratings.updateOne(
                { _id: existing._id },
                {
                    $set: {
                        rating,
                        review,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            await ratings.insertOne({
                userId,
                showId,
                rating,
                review,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 🔥 Update aggregated rating
        const agg = await ratings.aggregate([
            { $match: { showId } },
            {
                $group: {
                    _id: "$showId",
                    avg: { $avg: "$rating" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        if (agg.length > 0) {
            await shows.updateOne(
                { _id: showId },
                {
                    $set: {
                        vote_average: agg[0].avg,
                        vote_count: agg[0].count
                    }
                }
            );
        }

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ⭐ Get reviews for a show
router.get("/:showId", async (req, res) => {
    const ratings = getRatingCollection();

    const reviews = await ratings
        .find({ showId: req.params.showId })
        .limit(50)
        .toArray();

    res.json(reviews);
});

module.exports = router;