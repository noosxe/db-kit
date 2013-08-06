(function() {
  "use strict";

  var _ = require('underscore');
  var inflection = require('inflection');

  var Adapter = require('./adapter');

  var Model = function(modelName, attributes, options) {
    var tableName = inflection.pluralize(modelName);

    attributes = _.map(attributes, function(value, key) {
      if (!_.isObject(value)) {
        value = { type: value };
      }

      if (!_.has(value, 'type')) {
        throw new Error('"' + key +'" has no type defined!');
      }

      if (!_.isObject(value.type) && !Adapter.typeExists(value.type)) {
        throw new Error('"' + value.type + '" type is unknown!');
      }

      return value;
    });

    this.getModelName = function() {
      return modelName;
    };

    this.getTableName = function() {
      return tableName;
    };

    this.getFields = function() {
      return attributes;
    };

    this.getFieldNames = function() {
      return _.keys(attributes);
    };

    this.getOptions = function() {
      return options;
    };
  };

  Model.prototype.sync = function(callback) {

  };

  Model.prototype.build = function(values, options) {
    options = _.extend({
      kit: this.getOptions().kit,
      model: this
    }, options || {});
    var KitObject = require('./object');
    return new KitObject(values, options);
  };

  Model.prototype.fromJson = function(json) {
    return this.build(JSON.parse(json));
  };

  Model.prototype.find = function(query, callback) {

  };

  module.exports = Model;

}());
