const { getDB } = require("../config/db");

function getRatingCollection() {
  return getDB().collection("ratings");
}

module.exports = { getRatingCollection };