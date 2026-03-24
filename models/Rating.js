const { getDB } = require("../config/db");

function getRatingCollection() {
  return getDB().collection("ratings");
}

async function createIndexes() {
  const col = getRatingCollection();

  await col.createIndex({ userId: 1, showId: 1 }, { unique: true });
  await col.createIndex({ showId: 1 });
  await col.createIndex({ userId: 1 });
}

module.exports = { getRatingCollection };