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

	this.adapter = tmpAdapter.instance({ connection: _.clone(this.options.connection) });
};

/**
 * Create an instance of Kit
 * @returns {Kit}
 */
Kit.instance = function() {
	var my = Object.create(Kit.prototype);
	return Kit.apply(my, arguments) || my;
};

module.exports = Kit;