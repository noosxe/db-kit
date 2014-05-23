"use strict";

var _ = require("lodash")
	, types = Object.freeze(require("./types"))
	, query = require("./query")
	//, Model = require("./model")
	//, Executor = require("./executor");


var Adapter = function (kit) {
	this.kit = kit;
	this.port = 3306;
	this.database = "mysql";
};

Adapter.prototype.query = function (queryObject, options) {
	options = _.extend(options || {}, {
		kit: this.kit,
		adapter: this
	});

	return query.run(queryObject, options);
};

Adapter.prototype.begin = query.begin;
Adapter.prototype.rollback = query.rollback;
Adapter.prototype.commit = query.commit;

Adapter.prototype.executor = function (options) {
	options = _.extend(options || {}, {
		kit: this.kit,
		queryInterface: query
	});

	return new Executor(options);
};

Adapter.prototype.__defineGetter__("types", function () {
	return types;
});

Adapter.prototype.typeExists = function (type) {
	return _.values(this.types).indexOf(type) !== -1;
};

Adapter.prototype.defineModel = function (modelName, attributes, options) {
	options = options || {};
	return new Model(modelName, attributes, _.extend(options, { adapter: this, kit: this.kit }));
};

module.exports = Adapter;