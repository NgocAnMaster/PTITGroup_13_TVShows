const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getShowCollection } = require("../models/Show");
const { getUserCollection } = require("../models/User");
const { ObjectId } = require("mongodb");

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

router.get("/:id", auth(["user", "admin"]), async (req, res) => {
    const shows = getShowCollection();
    const users = getUserCollection();

    const showId = new ObjectId(req.params.id);

    const show = await shows.findOne({ _id: showId });

    // 📌 Add to history
    await users.updateOne(
        { _id: new ObjectId(req.user.id) },
        {
            $addToSet: {
                history: showId
            }
        }
    );

    res.json(show);
});

module.exports = router;