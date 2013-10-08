var _ = require('lodash')
  , types = Object.freeze(require('./types'))
  , query = require('./query')
  , Model = require('./model');

module.exports = (function() {
  "use strict";

  var Adapter = function() {
    this.database = 'postgresql';
  };

  Adapter.prototype.query = query.query;
  Adapter.prototype.begin = query.begin;
  Adapter.prototype.rollback = query.rollback;
  Adapter.prototype.commit = query.commit;

  Adapter.prototype.__defineGetter__('types', function() {
    return types;
  });

  Adapter.prototype.typeExists = function(type) {
    return _.values(this.types).indexOf(type) !== -1;
  };

  Adapter.prototype.defineModel = function(modelName, attributes, options) {
    return new Model(modelName, attributes, _.defaults(options, { adapter: this }));
  };

  return Adapter;

}());
