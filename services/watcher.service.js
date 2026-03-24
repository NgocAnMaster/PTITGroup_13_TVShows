// const { getShowCollection } = require("../models/Show");
// const { getDB } = require("../config/db");

// let isSyncing = false;

// function setSyncing(val) {
//     isSyncing = val;
// }

// function initWatcher() {
//     //   const collection = getShowCollection();

//     //   const changeStream = collection.watch([], {
//     //     fullDocument: "updateLookup"
//     //   });

//     const source = getDB().collection("shows");

//     const changeStream = source.watch([], {
//         fullDocument: "updateLookup"
//     });

//     changeStream.on("change", (next) => {
//         if (isSyncing) return;

//         const { operationType, fullDocument, documentKey } = next;

//         if (operationType === "delete") {
//             console.log(`🗑 Deleted: ${documentKey._id}`);
//             return;
//         }

//         console.log(
//             `🔔 Live Update: [${operationType}] - ${fullDocument?.name || "Item"}`
//         );
//     });

//     changeStream.on("error", (err) =>
//         console.error("Change Stream Error:", err.message)
//     );
// }

// module.exports = { initWatcher, setSyncing };

const { getDB } = require("../config/db");

let isSyncing = false;

function setSyncing(val) {
    isSyncing = val;
}

function initWatcher() {
    const source = getDB().collection("shows");

    const changeStream = source.watch([
        {
            $match: {
                operationType: { $in: ["insert", "update", "replace", "delete"] }
            }
        }
    ], {
        fullDocument: "updateLookup"
    });

    changeStream.on("change", (next) => {
        if (isSyncing) return;

        const { operationType, fullDocument, documentKey } = next;

        if (operationType === "delete") {
            console.log(`🗑 Deleted: ${documentKey._id}`);
            return;
        }

        console.log(
            `🔔 Live Update: [${operationType}] - ${fullDocument?.name || "Item"}`
        );

        // 👉 future: update recommendation cache
    });

    changeStream.on("error", (err) =>
        console.error("Change Stream Error:", err.message)
    );
}

module.exports = { initWatcher, setSyncing };