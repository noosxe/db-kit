(function () {
  "use strict";

  var _ = require('underscore');

  module.exports.types = require('./types');
  module.exports.typeExists = function(type) {
    return _.values(module.exports.types).indexOf(type) != -1;
  };

  module.exports.defineModel = function(modelName, attributes, options) {
    var Model = require('./model');
    return new Model(modelName, attributes, options);
  };

  module.exports.query = function(queryObject, callback, options) {

  };

}());
