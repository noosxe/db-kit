"use strict";

var util = require('util');
var Collection = require('./collection.js');

/**
 * MySQL.CollectionFactory
 * @constructor
 */
var CollectionFactory = function() {};

CollectionFactory.build = function(definition) {
	var collection = function() {};

	util.inherits(collection, Collection);

	collection.create();

	//console.log(util.inspect(collection, { showHidden: true, depth: null }));

	return collection;
};

module.exports = CollectionFactory;