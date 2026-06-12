const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getShowCollection } = require("../models/Show");
const { getUserCollection } = require("../models/User");
const { ObjectId } = require("mongodb");
const optionalAuth = require("../middleware/optionalAuth.middleware");

// Create/Update Show
router.post("/", auth(["staff", "admin"]), async (req, res) => {
    const collection = getShowCollection();
    const show = req.body;

    if (!show.id && !show.name)
        return res.status(400).send("ID or Name required");

    await collection.updateOne(
        { id: show.id },
        { $set: show },
        { upsert: true }
    );

    res.json({ status: "success", data: show });
});

// Delete Show
router.delete("/:id", auth(["staff", "admin"]), async (req, res) => {
    const collection = getShowCollection();
    const showId = parseInt(req.params.id);

    const result = await collection.deleteOne({ id: showId });

    res.json({
        status: result.deletedCount ? "deleted" : "not found"
    });
});

// GET Single Show Details (Fixed ObjectId conversion error)
router.get("/:id", optionalAuth, async (req, res) => {
    const shows = getShowCollection();
    const showParam = req.params.id;

    try {
        let query = {};
        // If it is a valid 24-char hex string check by ObjectId, otherwise query numeric TMDB id
        if (ObjectId.isValid(showParam)) {
            query = { _id: new ObjectId(showParam) };
        } else {
            query = { id: parseInt(showParam) };
        }

        const show = await shows.findOne(query);

        if (!show) {
            return res.status(404).json({ error: "Show not found" });
        }

        return res.json(show);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get Paginated Shows
router.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    const shows = await getShowCollection()
        .find({})
        .sort({ popularity: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

    res.json(shows);
});

module.exports = router;