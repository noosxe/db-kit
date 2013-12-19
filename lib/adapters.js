"use strict";

module.exports = {
  POSTGRES: "postgres",
  postgres: function() { return require("./adapters/pg/adapter"); },

  MONGO: "mongo",
  mongo: function() { return require("./adapters/mongo/adapter"); }
};
