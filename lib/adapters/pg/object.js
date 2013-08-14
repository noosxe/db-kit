(function(){
  "use strict";

  var crypto = require('crypto');
  var _ = require('underscore');

  /**
   * Quote a string
   *
   * @param string
   * @returns {string}
   */
  function quote(string) {
    return '"' + string + '"';
  }

  /**
   * Calculate md5 hash
   *
   * @param string
   * @returns {*}
   */
  function md5(string) {
    var hash = crypto.createHash('md5');
    hash.update(string);
    return hash.digest('hex');
  }

  module.exports = function(values, options) {
    var modelFields = options.model.getFields();
    var fieldNames = options.model.getFieldNames();
    var fromDB = options.fromDB || false;

    if (!fromDB) {
      var keys = _.keys(values);
      var diff = _.difference(fieldNames, keys);

      _.each(diff, function(di) {
        if (options.model.isReadOnly(di)) {
          throw new Error('field ' + quote(di) + ' was defined as readOnly, but no value is provided!');
        }
      });
    }

    _.each(values, function(value, key) {

      // check for unknown fields
      if (!options.model.hasField(key) && !fromDB) {
        throw new Error(quote(key) + ' is not defined!');
      }

      var field = modelFields[key];

      // generate inner objects
      if (_.isObject(value)) {
        if (options.model.isReference(key)) {
          value = field.reference.entity.build(value);
          values[key] = value;
        } else {
          throw new Error('value provided for ' + quote(key) + ' can\'t be an object');
        }
      }
    }, this);

    fieldNames.push('id');

    _.each(fieldNames, function(key) {
      // define setter
      if (!options.model.isReadOnly(key) && key !== 'id') {
        this.__defineSetter__(key, function(newVal) {
          values[key] = newVal;
        });
      }

      // define getter
      this.__defineGetter__(key, function() {
        return _.has(values, key) ? values[key] : null;
      });
    }, this);

    this.getOptions = function() {
      return options;
    };

    this.getValues = function() {
      return values;
    };

    this.save = function(callback, opts) {
      var model = options.model
      var columns = [];
      var dollars = [];
      var iValues  = [];

      var q = 'INSERT INTO ' + quote(model.getTableName()) + ' (';
      var i = 1;

      _.each(model.getFields(), function(value, key) {
          if (_.has(values, key)) {
            columns.push(key);
            dollars.push('$'+i);
            iValues.push(values[key]);

            ++i;
          } else if (model.isRequired(key)) {
            throw new Error('value for field ' + quote(key) + ' was not provided');
          }
      }, this);

      q += columns.map(function(v) {
        return quote(v);
      }).join(', ');

      q += ') VALUES (';
      q += dollars.join(', ');
      q += ') RETURNING "id"';

      options.kit.query({
        name: 'insert_into_' + model.getTableName() + '_' + md5(q),
        text: q,
        values: iValues
      }, function(err, rows, result) {
        var returning = null;

        if (!err) {
          returning = values['id'] = rows[0].id;
        }

        if (callback) {
          callback(err, returning);
        }
      });
    };

    this.delete = function(callback) {

    };

    this.toJson = function() {
      return JSON.stringify(values);
    };

    this.toString = function() {
      return values;
    };
  };

}());
