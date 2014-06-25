"use strict";

var dejavu  = require('dejavu');
var _       = require('lodash');
var query   = require('db-kit.query').mysql;

var Collection = dejavu.AbstractClass.declare({

	$name: 'Collection',
	$locked: false,

	_values: {},

	$statics: {

		_connection: null,
		_fields: {},
		_options: {},

		create: function() {
			var q = query(this._options.collectionName);
			_.forEach(this._fields, function(fieldAttrs, name) {
				q.addColumn(_.merge(fieldAttrs, { name: name }));
			});

			q.ifNotExists().createTable();

			return this._connection.query(q.toString());
		},

		destroy: function() {

		},

		find: function() {

		},

		findOne: function() {

		},

		update: function() {

		}
	},

	$finals: {
		save: function() {

		},

		reload: function() {

		},

		delete: function() {

		}
	}
});

module.exports = Collection;