const axios = require("axios");
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");

const { getShowCollection } = require("../models/Show");
const { setSyncing } = require("./watcher.service");

async function syncDataset() {
  const collection = getShowCollection();

  setSyncing(true);
  console.log("📡 Starting High-Speed Bulk Sync...");

  try {
    const response = await axios({
      method: "get",
      url: process.env.JSON_URL,
      responseType: "stream"
    });

    const pipeline = chain([response.data, parser(), streamArray()]);

    let batch = [];
    const BATCH_SIZE = 500;
    let total = 0;

    for await (const { value } of pipeline) {
      batch.push({
        updateOne: {
          filter: value.id ? { id: value.id } : { name: value.name },
          update: { $set: value },
          upsert: true
        }
      });

      if (batch.length >= BATCH_SIZE) {
        const res = await collection.bulkWrite(batch, { ordered: false });
        total += res.upsertedCount + res.modifiedCount;
        batch = [];

        process.stdout.write(`⚡ Synced ~${total} items...\r`);
      }
    }

    if (batch.length > 0) {
      await collection.bulkWrite(batch, { ordered: false });
    }

    console.log(`\n✅ Sync Complete! Total processed: ${total}`);
  } catch (err) {
    console.error("❌ Sync Failed:", err.message);
  } finally {
    setSyncing(false);
  }
}

module.exports = { syncDataset };