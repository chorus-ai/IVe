"use strict";

const fs = require("fs");
const path = require("path");

function loadRelations({ directory, db }) {
  fs.readdirSync(directory)
    .filter((dir) => fs.lstatSync(path.join(directory, dir)).isDirectory())
    .forEach((dir) => {
      const relationsPath = path.join(directory, dir, "_relations.js");

      if (fs.existsSync(relationsPath)) {
        const setupRelations = require(relationsPath);
        setupRelations(db);
      } else {
        // keep same behavior (you had console.error)
        console.error(`Relations file not found in ${dir}`);
      }
    });
}

module.exports = { loadRelations };