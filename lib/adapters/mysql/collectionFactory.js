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
			_primaryKey: definition.primaryKey,
			_options: _.merge(definition.options, options),
			_schema: options.adapter.schema
		},

		initialize: function(values) {
			values = values || {};

			this._collectionName = definition.options.collectionName;

			_.forEach(this.$self._fields, function(attrs, name) {
				this.__defineGetter__(name, function() {
					return this._values[name];
				}.$bind(this));

				if (!attrs.readOnly) {
					this.__defineSetter__(name, function (value) {
						this._values[name] = value;
					}.$bind(this));
				}

				if (!values[name]) {
					this._values[name] = null;
					return;
				}

				if (attrs.reference) {
					if (_.isArray(values[name])) {
						if (values[name].length > 0) {
							values[name] = values[name][0];
						} else {
							this._values[name] = null;
							return;
						}
					}

					var refCollectionName = attrs.reference.collection;
					var refCollection = this.$static._schema.collections[refCollectionName];

					this._values[name] = new refCollection(values[name]);
				} else {
					this._values[name] = values[name];
				}
			}.$bind(this));

			_.forEach(this.$static._options.accessors, function(acc, name) {
				this.__defineGetter__(name, function() {
					return this._values[name];
				}.$bind(this));

				if (!values[name]) {
					this._values[name] = [];
					return;
				}

				var linkedCollectionName = acc.child;
				var linkedCollection = this.$static._schema.collections[linkedCollectionName];

				this._values[name] = _.map(values[name], function(item) {
					return new linkedCollection(item);
				}.$bind(this));
			}.$bind(this));

			this._primaryKey = definition.primaryKey;
		}
	};

	return dejavu.Class.declare(def);
};

module.exports = CollectionFactory;