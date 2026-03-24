const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getShowCollection } = require("../models/Show");
const { getUserCollection } = require("../models/User");
const { ObjectId } = require("mongodb");
const optionalAuth = require("../middleware/optionalAuth.middleware");

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

router.delete("/:id", auth(["staff", "admin"]), async (req, res) => {
    const collection = getShowCollection();
    const showId = parseInt(req.params.id);

    const result = await collection.deleteOne({ id: showId });

    res.json({
        status: result.deletedCount ? "deleted" : "not found"
    });
});

router.get("/:id", optionalAuth, async (req, res) => {
    const shows = getShowCollection();
    const users = getUserCollection();

    const showId = new ObjectId(req.params.id);

    try {
        const show = await shows.findOne({ _id: showId });

        if (!show) {
            return res.status(404).json({ error: "Show not found" });
        }

        // 📌 Add to history
        // ✅ Only update if logged in
        if (req.user) {
            await users.updateOne(
                { _id: new ObjectId(req.user.id) },
                {
                    $addToSet: {
                        history: showId
                    }
                }
            );
        }

        res.json(show);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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