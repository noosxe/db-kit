"use strict";

var path = require('path');
var schemasDir = path.join(__dirname, "schemas");
var Kit = require("../index.js");

var kit = new Kit({
	adapter: Kit.adapters.MYSQL,
	connString: "mysql://root:@localhost:3306/test"
});

kit.query({ text: "SELECT ?+? AS result", values: [4, 5] }).on('error', function(err) {
	console.log(err);
}).on('done', function(result) {
	console.log(result);
});