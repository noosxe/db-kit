"use strict";

var dejavu  = require('dejavu');
var _       = require('lodash');
var query   = require('db-kit.query').mysql;

var Collection = dejavu.AbstractClass.declare({

	$name: 'Collection',
	$locked: false,

	_values: {},
	_primaryKey: '',

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
			var q = query(this._options.collectionName);

			q.ifExists().dropTable();

			return this._connection.query(q.toString());
		},

		empty: function() {
			var q = query(this._options.collectionName);

			q.truncate();

			return this._connection.query(q.toString());
		},

		find: function() {
			var q = query(this._options.collectionName);

			q.select();
			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).map(function(item) {
				return new thisClass(item);
			});
		},

		findOne: function() {
			var q = query(this._options.collectionName);

			q.select();
			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).then(function(results) {
				return results.length > 0 ? (new thisClass(results[0])) : null;
			});
		},

		update: function() {

		}
	},

	$finals: {
		save: function() {
			var q = query(this.$static._options.collectionName);

			q.insert(this._values);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values);
		},

		reload: function() {

		},

		delete: function() {
			var q = query(this.$static._options.collectionName);

			q.delete();
			q.where(this._primaryKey, this._values[this._primaryKey]);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values);
		}
	}
});

module.exports = Collection;