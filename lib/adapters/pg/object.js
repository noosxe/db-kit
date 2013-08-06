(function(){
  "use strict";

  var _ = require('underscore');

  var KitObject = function(values, options) {
    values = _.map(values, function(value, key) {
      if (_.isObject(value)) {

      }

      return value;
    });

    this.getOptions = function() {
      return options;
    };

    this.getValues = function() {
      return values;
    };
  };

  KitObject.prototype.save = function(callback, options) {

  };

  module.exports = KitObject;

}());
