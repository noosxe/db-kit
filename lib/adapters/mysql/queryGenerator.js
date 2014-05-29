"use strict";

var _ = require('lodash')
	, quote = require('./util').quote
	, md5 = require('./util').md5
	, types = require('./types');

module.exports = {
	createTable: function(attributes, options) {
		var q = "CREATE TABLE IF NOT EXISTS " + quote(options.tableName);

		var columns = [];
		_.forEach(attributes, function(attrProps, attrName) {
			var attrType = attrProps.type;

			if (attrType == "VARCHAR") {
				attrType = "VARCHAR(" + (attrProps.length || 255) + ")";
			}

			var column = quote(attrName) + ' ' + attrType;

			if (_.has(attrProps, 'default') && attrProps.default) {
				column += ' DEFAULT ' + (_.isFunction(attrProps.default) ? attrProps.default() : attrProps.default);
			}

			if (!(_.has(attrProps, 'optional') && attrProps.optional)) {
				column += ' NOT NULL';
			}

			if (_.has(attrProps, 'unique') && attrProps.unique) {
				column += ' UNIQUE';
			}

			if (_.has(attrProps, 'primary') && attrProps.primary) {
				column += ' PRIMARY KEY';
			}

			if (_.has(attrProps, 'autoIncrement') && attrProps.autoIncrement) {
				column += ' AUTO_INCREMENT';
			}

			columns.push(column);
		}, this);

		q += ' (' + columns.join(', ') + ')';

		return { q: q, v: [] };
	},
};