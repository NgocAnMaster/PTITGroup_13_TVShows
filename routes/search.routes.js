const express = require("express");
const router = express.Router();
const { getShowCollection } = require("../models/Show");

router.get("/", async (req, res) => {
  try {
    const collection = getShowCollection();
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: "Search term required" });

    let results = await collection
      .find(
        { $text: { $search: q } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .toArray();

    if (results.length === 0) {
      results = await collection
        .find({
          $or: [
            { name: { $regex: q, $options: "i" } },
            { original_name: { $regex: q, $options: "i" } }
          ]
        })
        .limit(10)
        .toArray();
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;