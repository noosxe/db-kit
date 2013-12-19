"use strict";

var crypto = require("crypto");

module.exports.quote = function (string) {
  return '"' + string + '"';
};

module.exports.md5 = function (string) {
  var hash = crypto.createHash("md5");
  hash.update(string);
  return hash.digest("hex");
};
