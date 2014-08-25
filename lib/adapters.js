"use strict";

module.exports = {
	MYSQL: "mysql",
	mysql: function() { return require("./adapters/mysql/index.js"); }
};
