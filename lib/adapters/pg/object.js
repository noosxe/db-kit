(function(){
  "use strict";

  var _ = require('underscore');

  var KitObject = function(values, options) {
    var modelFields = options.model.getFields();

    for (var key in values) {
      if (values.hasOwnProperty(key)) {
        var value = values[key];

        if (!_.has(modelFields, key)) {
          throw new Error('"' + key + '" is not defined!');
        }

        var field = modelFields[key];

        if (_.isObject(value)) {
          if (_.has(field, 'reference')) {
            value = field.reference.entity.build(value);
            values[key] = value;
          } else {
            throw new Error('value provided for "' + key + '" can\'t be an object');
          }
        }

        this.__defineGetter__(key, function() {
          return _.has(values, key) ? values[key] : null;
        });

        if (!_.has(field, 'readOnly') || !field.readOnly) {
          this.__defineSetter__(key, function(newVal) {
            values[key] = newVal;
          });
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

  module.exports = KitObject;

}());
