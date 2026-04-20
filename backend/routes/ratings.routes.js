const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

const { ObjectId } = require("mongodb");

const { getRatingCollection } = require("../models/Rating");
const { getShowCollection } = require("../models/Show");


// ⭐ Add / Update rating
router.post("/", auth(["user", "staff", "admin"]), async (req, res) => {
    try {
        if (!ObjectId.isValid(req.body.showId)) {
            return res.status(400).json({ error: "Invalid showId" });
        }

        // const { userId, showId, rating, review } = req.body;
        const showId = new ObjectId(req.body.showId);
        const userId = new ObjectId(req.user.id);
        const rating = req.body.rating;
        const review = req.body.review;


        if (rating < 1 || rating > 10) {
            return res.status(400).json({ error: "Invalid rating" });
        }

        const ratings = getRatingCollection();
        const shows = getShowCollection();

        // ratings.createIndex({ userId: 1, showId: 1 }, { unique: true });

        const existing = await ratings.findOne({
            userId: userId,
            showId: showId
        });

        if (
            existing &&
            req.user.role === "user" &&
            existing.userId.toString() !== req.user.id
        ) {
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
    const showId = new ObjectId(req.params.showId);

    // Get query params with defaults
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const sortBy = req.query.sortBy || "createdAt"; // default sort field
    const order = req.query.order === "asc" ? 1 : -1; // default descending

    const sortOptions = {};
    sortOptions[sortBy] = order;

    const reviews = await ratings
        .find({ showId })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();

    res.json(reviews);
});


// 🗑 Delete a review
router.delete("/:id", auth(["user", "staff", "admin"]), async (req, res) => {
    try {
        const ratings = getRatingCollection();
        const shows = getShowCollection();

        const reviewId = new ObjectId(req.params.id);

        const review = await ratings.findOne({ _id: reviewId });

        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        // 🔒 Ownership / permission check
        if (
            req.user.role === "user" &&
            review.userId.toString() !== req.user.id
        ) {
            return res.status(403).json({ error: "Not allowed" });
        }

        await ratings.deleteOne({ _id: review._id });

        // 🔄 Recalculate rating
        const agg = await ratings.aggregate([
            { $match: { showId: review.showId } },
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
                { _id: review.showId },
                {
                    $set: {
                        vote_average: agg[0].avg,
                        vote_count: agg[0].count
                    }
                }
            );
        } else {
            // no reviews left
            await shows.updateOne(
                { _id: review.showId },
                {
                    $set: {
                        vote_average: 0,
                        vote_count: 0
                    }
                }
            );
        }

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;