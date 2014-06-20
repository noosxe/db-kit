"use strict";

var util = require('util');
var dejavu = require('dejavu');
var _ = require('lodash');
var Collection = require('./collection.js');

/**
 * MySQL.CollectionFactory
 * @constructor
 */
var CollectionFactory = function() {};

CollectionFactory.build = function(definition) {
	var def = {

		$name: definition.options.collectionName,

		$extends: Collection,

		_fields: definition.fields,
		_options: definition.fields
	};

	return dejavu.Class.declare(def);
};

module.exports = CollectionFactory;