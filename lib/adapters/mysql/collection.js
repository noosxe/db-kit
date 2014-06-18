"use strict";

/**
 * Generic Collection class
 * @constructor
 */
var Collection = function() {
	this.fields = {};
};

Collection.prototype.save = function() {

};

Collection.prototype.reload = function() {

};

Collection.create = function() {
	console.log("created called");
};

Collection.destroy = function() {

};

module.exports = Collection;