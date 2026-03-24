const { getDB } = require("../config/db");

function getShowCollection() {
  return getDB().collection("shows");
}

async function createIndexes() {
  const collection = getShowCollection();

  try {
    await collection.createIndex(
      {
        name: "text",
        original_name: "text",
        genres: "text"
      },
      {
        default_language: "none",
        weights: { name: 10, original_name: 5, genres: 2 },
        name: "vn_text_search_index"
      }
    );

    await collection.createIndex({ id: 1 }, { unique: true });

    console.log("✅ Indexes created");
  } catch (e) {
    console.log("Index setup note:", e.message);
  }
}

module.exports = {
  getShowCollection,
  createIndexes
};