const { getDB } = require("../config/db");

function getRatingCollection() {
    return getDB().collection("ratings");
}

async function createRatingIndexes() {
    try {
        const col = getRatingCollection();

        await col.createIndex({ userId: 1, showId: 1 }, { unique: true });
        await col.createIndex({ showId: 1 });
        await col.createIndex({ userId: 1 });

        console.log("✅ Indexes for \"Rating\" created");
    }
    catch (e) {
        console.log("Index setup note:", e.message);
    }
}

module.exports = { getRatingCollection, createRatingIndexes };