(function() {
  "use strict";

  var crypto = require('crypto');
  var _ = require('underscore');
  var inflection = require('inflection');

  var Adapter = require('./adapter');

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

  module.exports = function(modelName, attributes, options) {
    var tableName = inflection.pluralize(modelName);
    var dependencies = [];

    this.hasField = function(fieldName) {
      return _.has(attributes, fieldName);
    };

    this.isRequired = function(fieldName) {
      return this.hasField(fieldName) && _.has(attributes[fieldName], 'required') && attributes[fieldName]['required']
    };

    this.isUnique = function(fieldName) {
      return this.hasField(fieldName) && _.has(attributes[fieldName], 'unique') && attributes[fieldName]['unique'];
    };

    this.isReference = function(fieldName) {
      return this.hasField(fieldName) && _.has(attributes[fieldName], 'reference');
    };

    this.isReadOnly = function(fieldName) {
      return this.hasField(fieldName) && _.has(attributes[fieldName], 'readOnly') && attributes[fieldName]['readOnly'];
    };

    this.isHidden = function(fieldName) {
      return this.hasField(fieldName) && _.has(attributes[fieldName], 'hidden') && attributes[fieldName]['hidden'];
    };

    _.each(attributes, function(value, key) {
      if (!_.isObject(value)) {
        value = { type: value };
        attributes[key] = value;
      }

      if (!_.has(value, 'type')) {
        throw new Error(quote(key) + ' has no type defined!');
      }

      if (!_.isObject(value.type) && !Adapter.typeExists(value.type)) {
        throw new Error(quote(value.type) + ' type is unknown!');
      }

      if (this.isReference(key)) {
        dependencies.push(value.reference.entity);
      }
    }, this);

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

    this.getDependencies = function() {
      return dependencies;
    };

    this.sync = function(callback) {
      var q = 'CREATE TABLE IF NOT EXISTS ' + quote(tableName) + ' (';

      var columns = [];

      columns.push(quote('id') + ' ' + Adapter.types.SERIAL + ' PRIMARY KEY');

      _.each(attributes, function(value, key) {

        var column = quote(key) + ' ' + value.type;

        if (this.isRequired(key)) {
          column += ' NOT NULL';
        }

        if (this.isUnique(key)) {
          column += ' UNIQUE';
        }

        if (this.isReference(key)) {
          var ref = value.reference;
          column += ' REFERENCES ' + ref.entity.getTableName() + '(' + quote(ref.field || 'id')  + ')';
        }

        columns.push(column);
      }, this);

      q += columns.join(', ');
      q += ')';

      options.kit.query({
        name: 'create_table_' + tableName + '_' + md5(q),
        text: q,
        values: []
      }, function(err, rows, result) {
        // TODO: check for errors
        if (callback) {
          callback(err);
        }
      });
    };

    this.drop = function(callback) {
      var q = 'DROP TABLE IF EXISTS ' + quote(tableName);
      options.kit.query({
        name: 'drop_table_' + tableName,
        text: q,
        values: []
      }, function(err, rows, result) {
        // TODO: check for errors
        if (callback) {
          callback(err);
        }
      });
    };

    this.build = function(values, options) {
      options = _.extend({
        kit: this.getOptions().kit,
        model: this
      }, options || {});
      var KitObject = require('./object');
      return new KitObject(values, options);
    };

    this.fromJson = function(json) {
      return this.build(JSON.parse(json));
    };

    this.find = function(query, callback) {
      var columns = [];
      var q = 'SELECT ';

      columns.push('id');

      _.each(attributes, function(value, key) {
        if (!this.isHidden(key)) {
          columns.push(key);
        }
      }, this);

      q += columns.map(function(v) {
        return quote(tableName) + '.' + quote(v);
      }).join(', ');

      q += ' FROM ' + quote(tableName);

      var $this = this;

      options.kit.query({
        name: 'select_from_' + tableName + '_' + md5(q),
        text: q,
        values: []
      }, function(err, rows, result) {
        var returning = [];

        if (!err) {
          returning = _.map(rows, function(row) {
            return this.build(row, { fromDB:true });
          }, $this);
        }

        if (callback) {
          callback(err, returning);
        }
      });
    };
  };

}());
