const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { getRecommendations } = require("../services/recommendation.service");


// 🎯 Get recommendations for current user
router.get("/", auth(["user", "admin"]), async (req, res) => {
  try {
    const userId = req.user.id;

    const recs = await getRecommendations(userId, 20);

    res.json(recs);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;