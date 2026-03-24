const { getDB } = require("../config/db");

function getUserCollection() {
  return getDB().collection("users");
}

module.exports = { getUserCollection };