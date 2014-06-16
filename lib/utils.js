"use strict";

var _ = require('lodash');

/**
 * Utils
 * @constructor
 */
var Utils = function() {};

/**
 *
 * @type {Function|*}
 */
Utils.defaultsDeep = _.partialRight(_.merge, function deep(value, other) {
	return _.merge(value, other, deep);
});

module.exports = Utils;