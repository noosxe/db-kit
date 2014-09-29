"use strict";

var Utils             = require('../../utils.js');
var Schema            = require('db-kit.schema');
var query             = require('db-kit.query').mysql;
var Connection        = require('db-kit.connection-mysql');
var reader            = Schema.instance().YamlReader();
var CollectionFactory = require('./collectionFactory.js');
var fs                = require('fs');
var path              = require('path');
var Promise           = require('bluebird');
var _                 = require('lodash');

Promise.promisifyAll(fs);

/**
 * MySQL adapter class constructor
 * @constructor
 */
var MySQL = function() {

	this.options = arguments[0] || {};

	Utils.defaultsDeep(this.options, {
		connection: {
			host: 'localhost',
			port: 3306,
			user: 'root',
			password: '',
			database: 'test',
			charset: 'UTF8_UNICODE_CI',
			debug: false
		}
	});

	this.options.connection.string = 'mysql://'
		+ this.options.connection.user
		+ ':'
		+ this.options.connection.password
		+ '@'
		+ this.options.connection.host
		+ ':'
		+ this.options.connection.port
		+ '/'
		+ this.options.connection.database
		+ '?&charset='
		+ this.options.connection.charset;

	this.schema = {};
	this.connection = Connection.instance(this.options.connection);
};

/**
 * Returns an instance of MySQL adapter
 * @returns {MySQL.prototype}
 */
MySQL.instance = function() {
	var my = Object.create(MySQL.prototype);
	return MySQL.apply(my, arguments) || my;
};

/**
 * Loads schema definition from given directory
 * returning promise
 * @returns {*}
 */
MySQL.prototype.loadCollections = function() {
	var $this = this;

	return fs.readdirAsync($this.options.collections)
		.filter(function(fileName) {
			return fileName.match(/\.yml$/i);
		}).map(function(fileName) {
			return path.join($this.options.collections, fileName);
		}).map(reader.readFile)
			.map(reader.filterDoc)
			.reduce(function(schema, part) {
				return _.merge(schema, part);
			}, $this.schema)
			.then(reader.normalizeDoc);
};

/**
 * Build schema parts
 * @param sc
 */
MySQL.prototype.prepareSchema = function(sc) {
	_.forEach(this.schema.collections, function(colDef, name) {
		this.schema.collections[name] = CollectionFactory.build(colDef, {
			connection: this.connection,
			adapter: this,
			raw: this.options.raw
		});
	}, this);
};

/**
 * Setup adapter and assign schema reference to kit
 * @param kit
 * @returns {*|Promise<U>|Promise.Thenable<U>}
 */
MySQL.prototype.setup = function(kit) {
	this.kit = kit;
	return this.loadCollections().then(this.prepareSchema.bind(this)).then(function() {
		this.kit.schema = this.schema;
	}.bind(this));
};

/**
 * Perform a query
 * @returns {*}
 */
MySQL.prototype.query = function() {
	return this.connection.query.apply(this.connection, arguments);
};

MySQL.prototype.sync = function() {
	var resolved = [];
	var collections = this.schema.collections;
	var connections = _.values(this.schema.connections);

	var resolve = function(collection) {
		var deps = collection.getDependencies();

		_.forEach(deps, function(dep) {
			if (resolved.indexOf(dep) === -1) {
				resolve(this.schema.collections[dep]);
			}
		});

		resolved.push(collection.getCollectionName());
	};

	_.forEach(collections, function(collection, name) {
		if (resolved.indexOf(name) === -1) {
			resolve(collection);
		}
	});

	return Promise.reduce(resolved, function(_, name) {
		var collection = collections[name];
		return collection.sync();
	}, []).then(function() {
		return Promise.reduce(connections, function(_, connection) {
			return this._genConnectionSchema(connection);
		}.bind(this), []);
	}.bind(this));
};

MySQL.prototype._genConnectionSchema = function(connection) {
	var collections = this.schema.collections;
	var parent = collections[connection.parent];
	var child = collections[connection.child];
	var order = connection.order;
	var tableName = connection.tableName;

	var parentPk = parent.getFields()[parent.getPrimaryKey()];
	var childPk = child.getFields()[child.getPrimaryKey()];

	var q = query(tableName);

	q.addColumn({
		name: 'parent',
		type: parentPk.type
	});

	q.addColumn({
		name: 'child',
		type: childPk.type
	});

	q.addReference({
		column: 'parent',
		table: parent.getTableName(),
		field: parent.getPrimaryKey()
	});

	q.addReference({
		column: 'child',
		table: child.getTableName(),
		field: child.getPrimaryKey()
	});

	if (order) {
		q.addColumn({
			name: order,
			type: 'INT'
		});
	}

	q.setPrimaryKeyFields(['parent','child']);

	q.ifNotExists().createTable();

	return this.connection.query(q.toString());
};

module.exports = MySQL;
