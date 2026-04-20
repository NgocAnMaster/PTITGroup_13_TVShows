const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getUserCollection } = require("../models/User"); // Adjust path as needed
const { ObjectId } = require("mongodb");

// GET User History
router.get("/history", auth(["user", "staff", "admin"]), async (req, res) => {
    const users = getUserCollection()
    const userId = new ObjectId(req.user.id);
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    try {
        const results = await users.aggregate([
            { $match: { _id: userId } },
            { $unwind: "$history" },
            { $sort: { "history.lastViewed": -1 } }, // Latest first
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "shows", // Name of your shows collection
                    localField: "history.showId",
                    foreignField: "_id",
                    as: "showDetails"
                }
            },
            { $unwind: "$showDetails" },
            {
                $project: {
                    _id: "$showDetails._id",
                    name: "$showDetails.name",
                    poster_path: "$showDetails.poster_path",
                    vote_average: "$showDetails.vote_average",
                    lastViewed: "$history.lastViewed"
                }
            }
        ]).toArray();

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Add to History (Called when viewing details) - Skip, shows.routes.js already have one
router.post("/history/:showId", auth(["user", "staff", "admin"]), async (req, res) => {
    const users = getUserCollection()
    const userId = new ObjectId(req.user.id);
    const showId = new ObjectId(req.params.showId);
    const now = new Date();
    try {
        // 1. Try to update the lastViewed of an existing show in history
        const result = await users.updateOne(
            { _id: userId, "history.showId": showId },
            { $set: { "history.$.lastViewed": now } }
        );

        // 2. If the show wasn't in history (matchedCount === 0), add it
        if (result.matchedCount === 0) {
            await users.updateOne(
                { _id: userId },
                {
                    $push: {
                        history: { showId: showId, lastViewed: now }
                    }
                }
            );
        }
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;