const express = require("express");
const router = express.Router();
const { getShowCollection } = require("../models/Show");

// Helper function to safely sanitize incoming terms for Regex execution
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get("/", async (req, res) => {
  try {
    const collection = getShowCollection();
    let { q } = req.query;

    if (!q) return res.status(400).json({ error: "Search term required" });

    // Sanitize values for downstream pipeline execution
    const escapedQuery = escapeRegex(q.trim());

    let results = [];
    
    try {
      // Try Text Search Indexing logic first
      results = await collection
        .find(
          { $text: { $search: q } },
          { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(20)
        .toArray();
    } catch (indexError) {
      // Fallback if text indexes aren't fully instantiated yet
      results = [];
    }

    // Fallback directly to regular expressions if text score matches yields nothing
    if (results.length === 0) {
      results = await collection
        .find({
          $or: [
            { name: { $regex: escapedQuery, $options: "i" } },
            { original_name: { $regex: escapedQuery, $options: "i" } }
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