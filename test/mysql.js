"use strict";

var expect = require("chai").expect;
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var collectionsDir = path.join(__dirname, "collections");
var Kit = require("../index.js");

(new Kit({
	adapter: Kit.adapters.MYSQL,
	connString: "mysql://root:@localhost:3306/test",
	collectionsDir: collectionsDir
})).on('ready', function(kit) {
	kit.sync();
});