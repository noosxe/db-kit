"use strict";

var Utils = require('../../utils.js');
var Schema = require('db-kit.schema');
var Connection = require('db-kit.connection-mysql');
var reader = Schema.instance().YamlReader();
var CollectionFactory = require('./collectionFactory.js');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var _ = require('lodash');

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
			.map(reader.normalizeDoc)
			.reduce(function(schema, part) {
				return _.merge(schema, part);
			}, $this.schema);
};

/**
 * Build schema parts
 * @param sc
 */
MySQL.prototype.prepareSchema = function(sc) {
	_.forEach(this.schema.collections, function(colDef, name) {
		this.schema.collections[name] = CollectionFactory.build(colDef);
	}, this);
};

MySQL.prototype.setup = function(kit) {
	this.kit = kit;
	return this.loadCollections().then(this.prepareSchema.bind(this)).then(function() {
		this.kit.schema = this.schema;
	}.bind(this));
};

module.exports = MySQL;