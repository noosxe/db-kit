"use strict";

var dejavu      = require('dejavu');
var _           = require('lodash');
var Collection  = require('./collection.js');

/**
 * MySQL.CollectionFactory
 * @constructor
 */
var CollectionFactory = function() {};

CollectionFactory.build = function(definition, options) {
	options = options || {};

	var def = {
		$name: definition.options.collectionName,

		$extends: Collection,

		$statics: {
			_connection: options.connection || null,
			_fields: definition.fields,
			_options: _.merge(definition.options, options)
		},

		initialize: function(values) {
			_.forEach(this.$self._fields, function(attrs, name) {
				this.__defineGetter__(name, function() {
					return this._values[name];
				}.$bind(this));

				if (!attrs.readOnly) {
					this.__defineSetter__(name, function (value) {
						this._values[name] = value;
					}.$bind(this));
				}

				this._values[name] = values[name];
				this._primaryKey = definition.primaryKey;
			}, this);
		}
	};

	return dejavu.Class.declare(def);
};

module.exports = CollectionFactory;