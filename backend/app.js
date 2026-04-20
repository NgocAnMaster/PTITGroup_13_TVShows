require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const { createIndexes } = require("./models/Show");
const { createRatingIndexes } = require("./models/Rating");
const { initWatcher } = require("./services/watcher.service");
const { syncDataset } = require("./services/sync.service");

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET missing in .env");
}

// Routes
const searchRoutes = require("./routes/search.routes");
const statsRoutes = require("./routes/stats.routes");
const showsRoutes = require("./routes/shows.routes");
const ratingRoutes = require("./routes/ratings.routes");
const authRoutes = require("./routes/auth.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/search", searchRoutes);
app.use("/stats", statsRoutes);
app.use("/shows", showsRoutes);
app.use("/ratings", ratingRoutes);
app.use("/auth", authRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/users", userRoutes);

async function start() {
  await connectDB();
  await createIndexes();
  await createRatingIndexes();

  initWatcher();
  syncDataset();

  app.listen(3000, () => {
    console.log("🌍 Server running: http://localhost:3000");
  });
}

start();