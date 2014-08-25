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
			var q = query(this._options.tableName);

			_.forEach(this._fields, function(fieldAttrs, name) {
				q.addColumn(_.merge(fieldAttrs, { name: name }));
			});

			q.ifNotExists().createTable();

			return this._connection.query(q.toString());
		},

		destroy: function() {
			var q = query(this._options.tableName);

			q.ifExists().dropTable();

			return this._connection.query(q.toString());
		},

		empty: function() {
			var q = query(this._options.tableName);

			q.truncate();

			return this._connection.query(q.toString());
		},

		find: function(constrains, includes, excludes, options) {
			var q = query(this._options.tableName);

			q.select();
			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).map(function(item) {
				return new thisClass(item);
			});
		},

		findOne: function(constrains, includes, excludes, options) {
			var q = query(this._options.tableName);

			q.select();
			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).then(function(results) {
				return results.length > 0 ? (new thisClass(results[0])) : null;
			});
		},

		update: function() {

		},

		/**
		 * Tree extension
		 * get direct children of item defined by constraints
		 */
		getChildrenOf: function() {
			var opt = this.$static._options;
			var tableName = this._options.tableName;

			var q = query(tableName, 'child');
			var columns = _.map(_.keys(this.$static._fields), function(val) {
				return 'child.' + val;
			});
			q.select(columns);
			q.join(tableName, 'parent');

			var on = {};

			on['child.' + opt.raw.mobius.left] = { gt : 'parent.' + opt.raw.mobius.left };
			on['child.' + opt.raw.mobius.right] = { lt : 'parent.' + opt.raw.mobius.right };
			on['child.' + opt.raw.mobius.b] = 'parent.' + opt.raw.mobius.a;
			on['parent.' + arguments[0]] = arguments[1];

			q.on(on);

			if (arguments[2] && arguments[3]) {
				q[arguments[3].toLowerCase()](arguments[2]);
			}

			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).map(function(item) {
				return new thisClass(item);
			});
		},

		/**
		 * Tree extension
		 * get all descendants tree of item defined by constraints
		 */
		getDescendantsOf: function(constraints) {

		}
	},

	$finals: {
		save: function() {
			var q = query(this.$static._options.tableName);

			q.insert(this._values);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values);
		},

		reload: function() {

		},

		delete: function() {
			var q = query(this.$static._options.tableName);

			q.delete();
			q.where(this._primaryKey, this._values[this._primaryKey]);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values);
		}
	}
});

module.exports = Collection;