"use strict";

var _ = require('lodash');

/**
 * db-kit class constructor
 * @param options
 * @constructor
 */
var Kit = function (options) {
	options = options || {};
	this.options = {
		adapter: options.adapter || 'mysql',
		debug: options.debug || false,
		collections: options.collections,
		connection: {
			host: options.host,
			port: options.port,
			user: options.user,
			password: options.password,
			database: options.database,
			charset: options.charset || 'UTF8_UNICODE_CI',
			debug: options.debug || false
		}
	};

	var tmpAdapter;

	switch (this.options.adapter) {
		default : {
			tmpAdapter = require('./adapters/' + this.options.adapter + '/index.js');
		}
	}

	this.adapter = tmpAdapter.instance({
		connection: _.clone(this.options.connection),
		collections: this.options.collections,
		raw: options
	});
};

/**
 * Create an instance of Kit
 * @returns {Kit}
 */
Kit.instance = function() {
	var my = Object.create(Kit.prototype);
	return Kit.apply(my, arguments) || my;
};

/**
 * Reads schema definitions from definition files
 * Prepares kit for work
 * @return {Promise} returns promise to finish setup
 */
Kit.prototype.setup = function() {
	return this.adapter.setup(this);
};

/**
 * Perform simple query by providing sql string
 * @return {Promise} returns promise to finish the query with results
 */
Kit.prototype.query = function() {
	return this.adapter.query.apply(this.adapter, arguments);
};

/**
 * Sync database tables
 * @return {Promise} returns promise to finish schema sync process
 */
Kit.prototype.sync = function() {
	return this.adapter.sync.apply(this.adapter, arguments);
};

module.exports = Kit;
