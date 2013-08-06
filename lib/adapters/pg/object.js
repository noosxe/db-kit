(function(){
  "use strict";

  var _ = require('underscore');

  module.exports = function(values, options) {
    var modelFields = options.model.getFields();
    var keys = _.keys(values);
    var diff = _.difference(_.keys(modelFields), keys);

    for (var i in diff) {
      if (diff.hasOwnProperty(i)) {
        var fieldOpts = modelFields[diff[i]];

        if (_.has(fieldOpts, 'readOnly') && fieldOpts.readOnly) {
          throw new Error('field "' + diff[i] + '" was defined as readOnly, but no value is provided!');
        }
      }
    }

    for (var key in values) {
      if (values.hasOwnProperty(key)) {
        var value = values[key];

        if (!_.has(modelFields, key)) {
          throw new Error('"' + key + '" is not defined!');
        }

        var field = modelFields[key];

        // define getter and setter
        if (!_.has(field, 'readOnly') || !field.readOnly) {
          this.__defineSetter__(key, function(newVal) {
            values[key] = newVal;
          });
        }

        this.__defineGetter__(key, function() {
          return _.has(values, key) ? values[key] : null;
        });

        // generate inner objects
        if (_.isObject(value)) {
          if (_.has(field, 'reference')) {
            value = field.reference.entity.build(value);
            values[key] = value;
          } else {
            throw new Error('value provided for "' + key + '" can\'t be an object');
          }
        }
      }
    }

    this.getOptions = function() {
      return options;
    };

    this.getValues = function() {
      return values;
    };

    this.save = function(callback, options) {

    };
  };

}());
