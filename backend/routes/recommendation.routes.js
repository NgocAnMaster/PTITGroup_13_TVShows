const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { getRecommendations, getCollaborativeRecommendations } = require("../services/recommendation.service");


// 🎯 Get recommendations for current user
router.get("/", auth(["user", "admin"]), async (req, res) => {
    try {
        const { type } = req.query;

        let recs;

        if (type === "collab") {
            recs = await getCollaborativeRecommendations(req.user.id);
        } else {
            recs = await getRecommendations(req.user.id);
        }

        res.json(recs);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;