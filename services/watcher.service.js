const { getShowCollection } = require("../models/Show");

let isSyncing = false;

function setSyncing(val) {
  isSyncing = val;
}

function initWatcher() {
  const collection = getShowCollection();

  const changeStream = collection.watch([], {
    fullDocument: "updateLookup"
  });

  changeStream.on("change", (next) => {
    if (isSyncing) return;

    const { operationType, fullDocument } = next;

    console.log(
      `🔔 Live Update: [${operationType}] - ${fullDocument?.name || "Item"}`
    );

    // 👉 later: update recommendation cache here
  });

  changeStream.on("error", (err) =>
    console.error("Change Stream Error:", err.message)
  );
}

module.exports = { initWatcher, setSyncing };