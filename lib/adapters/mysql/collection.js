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
			options = options || {};

			var r = this.$static._genSelectQuery({
				constraints: constraints,
				includes: includes,
				excludes: excludes,
				order: options.order,
				offset: options.offset,
				limit: options.limit,
				single: false
			});

			var query = r.q;

			var prep = query.toPrepared();

			return this.$static._connection.query(prep.text, prep.values).then(function(results) {
				return this.$static._processResults(results, r.mapping, false);
			}.$bind(this));
		},

		findOne: function(constraints, includes, excludes, options) {
			options = options || {};

			var r = this.$static._genSelectQuery({
				constraints: constraints,
				includes: includes,
				excludes: excludes,
				order: options.order,
				offset: options.offset,
				limit: options.limit,
				single: true
			});

			var query = r.q;

			var prep = query.toPrepared();

			return this.$static._connection.query(prep.text, prep.values).then(function(results) {
				return this.$static._processResults(results, r.mapping, true);
			}.$bind(this));
		},

		update: function() {

		},

		/**
		 * Tree extension
		 * get direct children of item defined by [parent] and limited by constraints
		 *
		 * @param parent
		 * @param constraints
		 * @param includes
		 * @param excludes
		 * @param options
		 * @returns {*|Promise<U>|Promise.Thenable<U>}
		 */
		getChildrenOf: function(parent, constraints, includes, excludes, options) {
			options = options || {};
			var opt = this.$static._options;

			var r = this.$static._genSelectQuery({
				constraints: constraints,
				includes: includes,
				excludes: excludes,
				order: options.order,
				offset: options.offset,
				limit: options.limit,
				single: false
			});

			var query = r.q;

			query.join(opt.tableName, 'parent');

			var on = {};

			on['table1.' + opt.raw.mobius.left] = { gt : 'parent.' + opt.raw.mobius.left };
			on['table1.' + opt.raw.mobius.right] = { lt : 'parent.' + opt.raw.mobius.right };
			on['table1.' + opt.raw.mobius.b] = 'parent.' + opt.raw.mobius.a;

			_.forEach(parent, function(value, field) {
				on['parent.' + field] = value;
			});

			query.on(on);

			var prep = query.toPrepared();

			return this.$static._connection.query(prep.text, prep.values).then(function(results) {
				return this.$static._processResults(results, r.mapping, false);
			}.$bind(this));
		},

		/**
		 * Tree extension
		 * get all descendants tree of item defined by constraints
		 *
		 * @param constrains
		 * @param includes
		 * @param excludes
		 * @param options
		 */
		getDescendantsOf: function(constrains, includes, excludes, options) {

		},

		/**
		 * Get items from the collection that are linked to some other collection item
		 *
		 * @param linkedCollection
		 * @param constraints
		 * @param includes
		 * @param excludes
		 * @param options
		 */
		getLinkedTo: function(linkedCollection, parent, constraints, includes, excludes, options) {
			options = options || {};
			var opt = this.$static._options;
			var linkedCollectionName = linkedCollection.getCollectionName();
			var linkedTableName = linkedCollection.getTableName();
			var linkedTableAlias = 'li_' + linkedTableName;
			var connection = this.$static._options.links[linkedCollectionName];
			var linkTableName = connection.tableName;
			var linkTableAlias = 'l_' + linkTableName;

			var r = this.$static._genSelectQuery({
				constraints: constraints,
				includes: includes,
				excludes: excludes,
				order: options.order,
				offset: options.offset,
				limit: options.limit,
				single: false
			});

			var query = r.q;

			query.join(linkTableName, linkTableAlias);

			var collectionName = this._options.collectionName;
			var isParent = connection.parent == collectionName;

			var on = {};

			if (isParent) {
				on[linkTableAlias + '.parent'] = 'table1' + '.' + this.$static.getPrimaryKey();
			} else {
				on[linkTableAlias + '.child'] = 'table1' + '.' + this.$static.getPrimaryKey();
			}

			query.on(on);

			query.join(linkedTableName, linkedTableAlias);

			var linkedOn = {};

			if (isParent) {
				linkedOn[linkTableAlias + '.child'] = linkedTableAlias + '.' + linkedCollection.getPrimaryKey();
			} else {
				linkedOn[linkTableAlias + '.parent'] = linkedTableAlias + '.' + linkedCollection.getPrimaryKey();
			}

			_.forEach(parent, function(value, field) {
				linkedOn[linkedTableAlias + '.' + field] = value;
			});

			query.on(linkedOn);

			var prep = query.toPrepared();

			return this.$static._connection.query(prep.text, prep.values).then(function(results) {
				return this.$static._processResults(results, r.mapping, false);
			}.$bind(this));
		},

		_genSelectQuery: function(components) {
			var constraints = components.constraints || {};
			var excludes = components.excludes || [];
			var includes = _.difference(components.includes || [], excludes);
			var order = components.order || [];
			var limit = components.limit || null;
			var offset = components.offset || null;
			var single = components.single || false;
			var mapping = {};
			var joins = [];

			var columnsToFetch = this.$static._genFetchColumnsForCollection({
				collection: this.$static,
				includes: includes,
				excludes: excludes,
				mapping: mapping,
				joins: joins
			});

			var q = query(this._options.tableName, 'table1');

			q.select(columnsToFetch);

			_.forEach(joins, function(join) {
				q.leftJoin(join.tableName, join.tableAlias);
				q.on(join.on);
			});

			var where = {};

			_.forEach(constraints, function(value, key) {
				where['table1.' + key] = value;
			});

			q.where(where);

			if (!_.isArray(order)) {
				order = [order];
			}

			_.forEach(order, function(o) {
				o = o.split(' ');
				var column = 'table1.' + o[0];
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

			if (single) {
				q.limit(1);
			} else {
				if (offset !== null) {
					q.offset(offset);
				}

				if (limit !== null) {
					q.limit(limit);
				}
			}

			return { q: q, mapping: mapping };
		},

		/**
		 * Process select query results
		 *
		 * @param results
		 * @param mapping
		 * @param single
		 * @returns {*|Promise<U[]>|TResult}
		 * @private
		 */
		_processResults: function(results, mapping, single) {
			single = single || false;
			results = _.map(this.$static._combineResultSet(results, mapping), function(result) {
				result = new this(result);
				result.onAfterLoad();
				return result;
			}.$bind(this));

			return single ? results[0] : results;
		},

		/**
		 * Generate column names and their aliases that need to be fetched during query
		 * Generate joins statements for references and accessor type connections
		 * Will recursively go into includes
		 * Includes:
		 * -- simple hidden fields
		 * -- reference fields to other collections
		 * -- accessors to child collections
		 *
		 * @param components
		 * @returns {{}}
		 * @private
		 */
		_genFetchColumnsForCollection: function(components) {
			var collection = components.collection;
			var mapping = components.mapping;
			var includes = components.includes || [];
			var excludes = components.excludes || [];
			var joins = components.joins;
			var index = components.index || { value: 1 };
			var originalIndex = index.value;
			var collectionName = collection._options.collectionName;
			var prefix = components.prefix || collectionName;
			var tableAlias = 'table' + index.value;
			var parentFieldName = components.parentFieldName;
			var fields = collection.getFields();
			var columnsToFetch = {};

			this._options.accessors = this._options.accessors || {};

			// just include plain fields
			_.forEach(fields, function(field, name) {
				if (excludes.indexOf(name) !== -1) return;
				if (field.hidden || field.reference) return;

				mapping[parentFieldName || collectionName] = collectionName;
				columnsToFetch[tableAlias + '.' + name] = prefix + '.' + name;
			});

			// add fields from includes list
			_.forEach(includes, function(field) {
				if (field.indexOf('.') !== -1) {
					return;
				}

				if (this._options.accessors[field]) {
					var link = this._options.accessors[field].connection;

					var linkedCollectionName = this._options.accessors[field].child;
					var linkedCollection = this.$static._schema.collections[linkedCollectionName];

					var linkTableAlias = 'l_t' + originalIndex + '_' + link.tableName + '_t' + (index.value + 1);

					var on = {};

					on[linkTableAlias + '.parent'] = 'table' + originalIndex + '.' + collection.getPrimaryKey();

					joins.push({
						tableName: link.tableName,
						tableAlias: linkTableAlias,
						on: on
					});

					var linkedOn = {};

					linkedOn[linkTableAlias + '.child'] = 'table' + (index.value + 1) + '.' + linkedCollection.getPrimaryKey();

					joins.push({
						tableName: linkedCollection.getTableName(),
						tableAlias: 'table' + (index.value + 1),
						on: linkedOn
					});

					++index.value;

					columnsToFetch = _.merge(columnsToFetch, this.$static._genFetchColumnsForCollection({
						collection: linkedCollection,
						includes: _.filter(_.map(includes, function(include) {
							var split = include.split('.');
							if (split.length > 1 && split[0] !== field) {
								return '';
							}
							split.splice(0, 1);
							return split.join('.');
						})),
						excludes: _.filter(_.map(excludes, function(exclude) {
							var split = exclude.split('.');
							split.splice(0, 1);
							return split.join('.');
						})),
						parentFieldName: field,
						mapping: mapping,
						index: index,
						prefix: prefix + '.' + field,
						joins: joins
					}));

					return;
				}

				if (!fields[field]) {
					throw new Error('no such field [' + field + ']');
				}

				if (fields[field].hidden) {
					mapping[parentFieldName || collectionName] = collectionName;
					columnsToFetch[tableAlias + '.' + field] = prefix + '.' + field;
					return;
				}

				if (fields[field].reference) {
					var refCollectionName = fields[field].reference.collection;
					var refCollection = this.$static._schema.collections[refCollectionName];

					var on = {};

					on['table' + originalIndex + '.' + field] = 'table' + (index.value + 1) + '.' + refCollection.getPrimaryKey();

					joins.push({
						tableName: refCollection.getTableName(),
						tableAlias: 'table' + (index.value + 1),
						on: on
					});

					++index.value;

					columnsToFetch = _.merge(columnsToFetch, this.$static._genFetchColumnsForCollection({
						collection: refCollection,
						includes: _.filter(_.map(includes, function(include) {
							var split = include.split('.');
							if (split.length > 1 && split[0] !== field) {
								return '';
							}
							split.splice(0, 1);
							return split.join('.');
						})),
						excludes: _.filter(_.map(excludes, function(exclude) {
							var split = exclude.split('.');
							split.splice(0, 1);
							return split.join('.');
						})),
						parentFieldName: field,
						mapping: mapping,
						index: index,
						prefix: prefix + '.' + field,
						joins: joins
					}));
				}
			}.$bind(this));

			return columnsToFetch;
		},

		_combineResultSet: function(data, mapping) {
			if (!data || data.length == 0) return [];

			// mark the order of items
			var uniqueKey = uuid.v4();
			_.forEach(data, function(item, i) {
				item[uniqueKey] = i;
			});

			var collections = this.$static._schema.collections;
			var collectionPrefix = _.keys(data[0])[0].split('.')[0];
			var collection = collections[mapping[collectionPrefix]];

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

			var combined = _.values(grouped);

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
					comb = _.map(comb, function(item) {
						var grouped = {};

						_.forEach(item, function(v, k) {
							var key = k.split('.')[0];
							grouped[key] = grouped[key] || {};
							grouped[key][k] = v;
						});

						return _.toArray(grouped);
					});

					comb = _.flatten(comb);

					comb = _.groupBy(comb, function(v, k) {
						return _.keys(v)[0].split('.')[0];
					});

					_.forEach(comb, function(group, groupName) {
						var col = collections[mapping[groupName]];
						var colPk = col.getPrimaryKey();

						group = _.uniq(group, groupName + '.' + colPk);
						construct[groupName] = this.$static._combineResultSet(group, mapping);
					}.$bind(this));
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
		getCollectionName: function() {
			return this.$static.getCollectionName();
		},

		save: function() {
			var q = query(this.$static._options.tableName);

			var values = this.onBeforeSave(this._values);

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
				this.onAfterSave(result);
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

		onAfterLoad: function() {
			var fields = this.$static._fields;
			var accessors = this.$static._options.accessors;

			_.forEach(fields, function(attrs, name) {
				if (attrs.multilang) {
					if (this._values[name]) {
						this._values[name] = this._parseMultilang(this._values[name]);
					} else {
						this._values[name] = {};
					}
				}

				if (attrs.reference && this._values[name]) {
					this._values[name].onAfterLoad();
				}
			}.$bind(this));

			_.forEach(accessors, function(acc, name) {

				_.forEach(this._values[name], function(item) {
					item.onAfterLoad();
				});

			}.$bind(this));
		},

		onBeforeSave: function(values) {
			var needTimestamps = this.$static._options.timestamps;

			if (needTimestamps) {
				var createdName = this.$static._options.createdAt;

				if (!values[createdName]) {
					values[createdName] = moment().format("YYYY-MM-DD HH:mm:ss");
				}
			}

			return values;
		},

		onAfterSave: function(result) {
			if (!this._values[this._primaryKey]) {
				this._values[this._primaryKey] = result.insertId;
			}
		},

		_parseMultilang: function(string) {
			var pattern = /\[([a-z]+)=([^\]]+)?\]/ig;
			var match;
			var translations = {};

			while(match = pattern.exec(string)) {
				translations[match[1]] = match[2] || '';
			}

			return translations;
		}
	}
});

module.exports = Collection;