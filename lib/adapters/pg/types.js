"use strict";

var _ = require("lodash"),
	types = {
		STRING: "varchar(255)",
		TEXT: "text",
		INT: "int",
		DOUBLE: "double",
		BOOL: "bool",
		DATE: "date"
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