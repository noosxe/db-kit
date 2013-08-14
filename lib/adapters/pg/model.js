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
      var fieldNames = this.getFieldNames();
      var columns = {};
      var values = [];
      var i = 1;
      var q = 'SELECT ';

      columns['id'] = 'id';

      // if query has 'fields' specified
      if (_.has(query, 'fields') && _.isArray(query.fields) && query.fields.length > 0) {
        _.each(query.fields, function(field) {
          if (_.isArray(field)) {
            if (_.contains(fieldNames, field[0])) {
              columns[field[0]] = field[1];
            } else {
              throw new Error('field ' + quote(field) + ' was not defined!');
            }
          } else {
            if (_.contains(fieldNames, field)) {
              columns[field] = field;
            } else {
              throw new Error('field ' + quote(field) + ' was not defined!');
            }
          }
        });
      } else {
        _.each(fieldNames, function(value) {
          if (!this.isHidden(value)) {
            columns[value] = value;
          }
        }, this);
      }

      q += _.map(columns, function(v, k) {
        return quote(tableName) + '.' + quote(k) + ( v === k ? '' : ' AS ' + quote(v) );
      }).join(', ');

      q += ' FROM ' + quote(tableName);

      // if query has 'where' specified
      if (_.has(query, 'where') && _.isObject(query.where) && !_.isEmpty(query.where)) {
        var c = [];

        _.each(query.where, function(v, k) {

          if ( _.isObject(v) ) {
            _.each(v, function(v1, k1) {

              switch (k1) {
                case 'like':
                  c.push(quote(k) + ' like $' + i++);
                  values.push(v1);
                  break;

                case 'eq' :
                  c.push(quote(k) + ' = $' + i++);
                  values.push(v1);
                  break;

                case 'ne' :
                  c.push(quote(k) + ' != $' + i++);
                  values.push(v1);
                  break;

                case 'gt':
                  c.push(quote(k) + ' > $' + i++);
                  values.push(v1);
                  break;

                case 'gte':
                  c.push(quote(k) + ' >= $' + i++);
                  values.push(v1);
                  break;

                case 'lt':
                  c.push(quote(k) + ' < $' + i++);
                  values.push(v1);
                  break;

                case 'lte':
                  c.push(quote(k) + ' <= $' + i++);
                  values.push(v1);
                  break;

                case 'between':
                  c.push(quote(k) + ' BETWEEN $' + i++ + ' AND $' + i++);
                  values.push(v1[0], v1[1]);
                  break;

                case 'nbetween':
                  c.push(quote(k) + ' NOT BETWEEN $' + i++ + ' AND $' + i++);
                  values.push(v1[0], v1[1]);
                  break;

                default:
                  throw new Error('unknown query operator ' + quote(k1));
              }

            }, this);
          } else {
            c.push(quote(k) + ' = $' + i++);
            values.push(v);
          }

        }, this);

        if (c.length > 0) {
          q += ' WHERE ' + c.join(' AND ');
        }
      }

      var $this = this;

      options.kit.query({
        name: 'select_from_' + tableName + '_' + md5(q),
        text: q,
        values: values
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

    this.delete = function(where, callback) {
      var columns = {};
      var values = [];
      var i = 1;
      var q = 'DELETE FROM ' + quote(tableName);
      var c = [];

      _.each(where, function(v, k) {

        if ( _.isObject(v) ) {
          _.each(v, function(v1, k1) {

            switch (k1) {
              case 'like':
                c.push(quote(k) + ' like $' + i++);
                values.push(v1);
                break;

              case 'eq' :
                c.push(quote(k) + ' = $' + i++);
                values.push(v1);
                break;

              case 'ne' :
                c.push(quote(k) + ' != $' + i++);
                values.push(v1);
                break;

              case 'gt':
                c.push(quote(k) + ' > $' + i++);
                values.push(v1);
                break;

              case 'gte':
                c.push(quote(k) + ' >= $' + i++);
                values.push(v1);
                break;

              case 'lt':
                c.push(quote(k) + ' < $' + i++);
                values.push(v1);
                break;

              case 'lte':
                c.push(quote(k) + ' <= $' + i++);
                values.push(v1);
                break;

              case 'between':
                c.push(quote(k) + ' BETWEEN $' + i++ + ' AND $' + i++);
                values.push(v1[0], v1[1]);
                break;

              case 'nbetween':
                c.push(quote(k) + ' NOT BETWEEN $' + i++ + ' AND $' + i++);
                values.push(v1[0], v1[1]);
                break;

              default:
                throw new Error('unknown query operator ' + quote(k1));
            }

          }, this);
        } else {
          c.push(quote(k) + ' = $' + i++);
          values.push(v);
        }
      }, this);

      if (c.length > 0) {
        q += ' WHERE ' + c.join(' AND ');
      }

      options.kit.query({
        name: 'delete_from_' + tableName + '_' + md5(q),
        text: q,
        values: values
      }, function(err, rows, result) {
        if (callback) {
          callback(err);
        }
      });
    };
  };

}());
