require("dotenv").config();
const express = require("express");

const { connectDB } = require("./config/db");
const { createIndexes } = require("./models/Show");
const { initWatcher } = require("./services/watcher.service");
const { syncDataset } = require("./services/sync.service");

// Routes
const searchRoutes = require("./routes/search.routes");
const statsRoutes = require("./routes/stats.routes");
const showsRoutes = require("./routes/shows.routes");
const ratingRoutes = require("./routes/ratings.routes");
const authRoutes = require("./routes/auth.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

const app = express();
app.use(express.json());

// Routes
app.use("/search", searchRoutes);
app.use("/stats", statsRoutes);
app.use("/shows", showsRoutes);
app.use("/ratings", ratingRoutes);
app.use("/auth", authRoutes);
app.use("/recommendations", recommendationRoutes);

async function start() {
  await connectDB();
  await createIndexes();

  initWatcher();
  syncDataset();

  app.listen(3000, () => {
    console.log("🌍 Server running: http://localhost:3000");
  });
}

start();