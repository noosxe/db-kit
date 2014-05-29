"use strict";

var _ = require("lodash"),
	types = {
		STRING: "VARCHAR",
		TEXT: "TEXT",
		INT: "INT",
		DOUBLE: "DOUBLE",
		BOOL: "BOOL",
		DATE: "DATE",
		TIMESTAMP: "TIMESTAMP"
	};

_.each(types, function (v, k) {
	if (_.isFunction(v)) {
		module.exports[k] = v;
	} else {
		module.exports.__defineGetter__(k, function () {
			return v;
		});
	}
});