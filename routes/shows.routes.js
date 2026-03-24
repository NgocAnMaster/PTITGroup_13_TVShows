const express = require("express");
const router = express.Router();
const { getShowCollection } = require("../models/Show");

router.post("/", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
  const collection = getShowCollection();
  const showId = parseInt(req.params.id);

  const result = await collection.deleteOne({ id: showId });

  res.json({
    status: result.deletedCount ? "deleted" : "not found"
  });
});

module.exports = router;