"use strict";

var dejavu  = require('dejavu');
var _       = require('lodash');
var query   = require('db-kit.query').mysql;
var moment  = require('moment');
var uuid    = require('uuid');

var Collection = dejavu.AbstractClass.declare({

	$name: 'Collection',
	$locked: false,

	_values: {},
	_primaryKey: '',

	$statics: {

		_connection: null,
		_fields: {},
		_options: {},

		getFields: function() {
			return this._fields;
		},

		getCollectionName: function() {
			return this._options.collectionName;
		},

		getTableName: function() {
			return this._options.tableName;
		},

		getPrimaryKey: function() {
			return this._primaryKey;
		},

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

		find: function(constraints, includes, excludes, options) {
			var q = query(this._options.tableName);

			q.select();
			q.where(constraints);
			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).map(function(item) {
				return new thisClass(item);
			});
		},

		findOne: function(constraints, includes, excludes, options) {
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
		getChildrenOf: function(constraints, includes, excludes, options) {
			constraints = constraints || {};
			includes = includes || [];
			excludes = excludes || [];
			options = options || {};

			includes = _.difference(includes, excludes);

			var opt = this.$static._options;
			var tableName = this._options.tableName;
			var collectionName = this._options.collectionName;
			var fields = this.$static._fields;
			var primaryTableName = 'child';
			var columnsToFetch;
			var joins;

			if (!opt.raw.mobius || !opt.raw.mobius.a || !opt.raw.mobius.b || !opt.raw.mobius.left || !opt.raw.mobius.right) {
				throw new Error('Tree encoding variables are not configured!');
			}

			columnsToFetch = this.$static._genFetchColumnsForCollection(this.$static, includes, excludes, primaryTableName);
			joins = this.$static._genFetchJoinsForCollection(this.$static, includes, excludes);

			// create a new query
			var q = query(tableName, primaryTableName);

			// assign fields to fetch
			q.select(columnsToFetch);

			q.join(tableName, 'parent');

			var on = {};

			on['child.' + opt.raw.mobius.left] = { gt : 'parent.' + opt.raw.mobius.left };
			on['child.' + opt.raw.mobius.right] = { lt : 'parent.' + opt.raw.mobius.right };
			on['child.' + opt.raw.mobius.b] = 'parent.' + opt.raw.mobius.a;

			_.forEach(constraints, function(value, field) {
				on['parent.' + field] = value;
			});

			q.on(on);

			_.forEach(joins, function(join) {
				var refCollectionName = join.reference.collection;
				var refCollection = this.$static._schema.collections[refCollectionName];
				q.leftJoin(refCollection.getTableName());

				var on = {};

				on['child.' + join.field] =  refCollection.getTableName() + '.' + refCollection.getPrimaryKey();

				q.on(on);

			}.$bind(this));

			if (options.order) {
				_.forEach(options.order, function(o) {
					var o = o.split(' ');
					var column = primaryTableName + '.' + o[0];
					var order = o[1].toLowerCase();

					switch (order) {
						case 'asc': {
							q.asc(column);
						}
							break;
						case 'desc': {
							q.desc(column);
						}
							break;
						default: {
							throw new Error('unknown order direction [' + order + ']');
						}
					}
				});
			}

			var prepared = q.toPrepared();

			var thisClass = this.$static;

			return this.$static._connection.query(prepared.text, prepared.values).then(function(results) {
				var combined = thisClass._combineResultSet(results);

				return _.map(combined, function(item) {
					_.forEach(item, function(fieldValue, fieldName) {
						if (_.isArray(fieldValue) && thisClass.getFields()[fieldName].reference) {
							item[fieldName] = fieldValue.length > 0 ? fieldValue[0] : null;
						}
					});

					var newItem = new thisClass(item);
					newItem._onAfterLoad();
					return newItem;
				});
			});
		},

		/**
		 * Tree extension
		 * get all descendants tree of item defined by constraints
		 */
		getDescendantsOf: function(constrains, includes, excludes, options) {

		},

		_genFetchColumnsForCollection: function(collection, includes, excludes, tableName, parentName) {
			includes = includes || [];
			excludes = excludes || [];
			tableName = tableName || collection._options.tableName;
			var fields = collection.getFields();
			var collectionName = collection._options.collectionName;
			var columnsToFetch = {};

			// just include plain fields
			_.forEach(fields, function(field, name) {
				if (excludes.indexOf(name) !== -1) return;
				if (field.hidden || field.reference) return;

				columnsToFetch[tableName + '.' + name] = (parentName ? parentName + '.' : '' ) + collectionName + '.' + name;
			});

			// add fields from includes list
			_.forEach(includes, function(field) {
				if (!fields[field]) {
					throw new Error('no such field [' + field + ']');
				}

				if (fields[field].reference) {
					var refCollectionName = fields[field].reference.collection;
					var refCollection = this.$static._schema.collections[refCollectionName];

					columnsToFetch = _.merge(columnsToFetch, this.$static._genFetchColumnsForCollection(refCollection, [], [], null, collectionName));
				}
			}.$bind(this));

			return columnsToFetch;
		},

		_genFetchJoinsForCollection: function(collection, includes, excludes) {
			var fields = collection.getFields();
			var joins = [];

			_.forEach(includes, function(field) {
				if (fields[field].reference) {
					joins.push({ field: field, reference: fields[field].reference });
				}
			});

			return joins;
		},

		_combineResultSet: function(data) {
			if (!data || data.length == 0) return [];

			// mark the order of items
			var uniqueKey = uuid.v4();
			_.forEach(data, function(item, i) {
				item[uniqueKey] = i;
			});
			// -----

			var collections = this.$static._schema.collections;

			var combined = [];

			var collectionPrefix = _.keys(data[0])[0].split('.')[0];
			var collection = collections[collectionPrefix];

			data = _.map(data, function(row) {

				_.forEach(row, function(value, field) {
					if (field == uniqueKey) return;

					var regex = new RegExp('^' + collectionPrefix + '.');
					var newField = field.replace(regex, '');
					row[newField] = value;
					delete row[field];
				});

				return row;
			});

			var identityKey = collection.getPrimaryKey();

			data = _.filter(data, function(obj) {
				return obj[identityKey];
			});

			var grouped = _.groupBy(data, function(obj) {
				return obj[identityKey];
			});

			combined = _.values(grouped);

			combined = _.map(combined, function(comb) {
				// single object scope
				// extract same fields

				var construct = {};
				var needRecursion = false;

				_.forEach(comb, function(row) {
					_.forEach(row, function(colValue, colName) {
						if (colName.indexOf('.') === -1) {
							construct[colName] = colValue;
							delete row[colName];
						} else {
							needRecursion = true;
						}
					});
				});

				if (needRecursion) {
					var recursionKey = _.keys(comb[0])[0].split('.')[0];
					construct[recursionKey] = this.$static._combineResultSet(comb);
				}

				return construct;
			}.$bind(this));

			combined = _.sortBy(combined, uniqueKey);

			_.forEach(combined, function(item, i) {
				delete item[uniqueKey];
			});

			return combined;
		}
	},

	$finals: {
		save: function() {
			var q = query(this.$static._options.tableName);

			var values = this._onBeforeSave(this._values);

			var toInsert = {};

			_.forEach(this.$static._fields, function(field, name) {
				if (!field.optional && !field.primary && !field.service && values[name] == undefined) {
					throw new Error('Field [' + name + '] is not optional');
				}

				if (values[name] != undefined) {
					toInsert[name] = values[name];
				}
			}, this);

			q.insert(toInsert);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values).then(function(result) {
				this._onAfterSave(result);
				return this;
			}.$bind(this));
		},

		reload: function() {

		},

		delete: function() {
			var q = query(this.$static._options.tableName);

			q.delete();
			q.where(this._primaryKey, this._values[this._primaryKey]);
			var prepared = q.toPrepared();

			return this.$static._connection.query(prepared.text, prepared.values);
		},

		_onAfterLoad: function() {
			var fields = this.$static._fields;

			_.forEach(fields, function(attrs, name) {
				if (attrs.multilang && this._values[name]) {
					this._values[name] = this._parseMultilang(this._values[name]);
				}
			}.$bind(this));
		},

		_onBeforeSave: function(values) {
			var needTimestamps = this.$static._options.timestamps;

			if (needTimestamps) {
				var createdName = this.$static._options.createdAt;

				if (!values[createdName]) {
					values[createdName] = moment().format("YYYY-MM-DD HH:mm:ss");
				}
			}

			return values;
		},

		_onAfterSave: function(result) {
			if (!this._values[this._primaryKey]) {
				this._values[this._primaryKey] = result.insertId;
			}
		},

		_parseMultilang: function(string) {
			var pattern = /\[([a-z]+)=([^\]]+)?\]/ig;
			var match;
			var translations = {};

			while(match = pattern.exec(string)) {
				translations[match[1]] = match[2];
			}

			return translations;
		}
	}
});

module.exports = Collection;