(function(){
  "use strict";

  var crypto = require('crypto');
  var async = require('async');
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
          value = field.reference.entity.build(value, _.clone(options));
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
      opts = opts || {};
      var topOne = false;


      var processIt = function() {
        var model = options.model;
        var columns = [];
        var dollars = [];
        var iValues  = [];
        var actionQueue = {};

        var q = 'INSERT INTO ' + quote(model.getTableName()) + ' (';
        var i = 1;

        _.each(model.getFields(), function(value, key) {
          if (_.has(values, key)) {
            var toUse = values[key];

            if (_.isObject(toUse)) {
              actionQueue[iValues.length] = function(callback) {
                toUse.save(callback, opts);
              };
            }

            columns.push(key);
            dollars.push('$' + i++);
            iValues.push(toUse);
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

        async.series(actionQueue, function(err, result) {
          if (err) {
            options.kit.rollback(opts['client'], opts['done']);
            callback(err, null);
            return;
          }

          _.each(result, function(v, k) {
            iValues[parseInt(k)] = v;
          });

          options.kit.query({
            name: 'insert_into_' + model.getTableName() + '_' + md5(q),
            text: q,
            values: iValues
          }, function(err, rows, result) {
            var returning = null;
            if (err == null && rows.length > 0) {
              returning = values['id'] = rows[0].id;
              if (topOne) {
                options.kit.commit(opts['client'], opts['done'], function(err) {
                  callback(err, returning);
                });
              } else {
                callback(err, returning);
              }
            } else {
              options.kit.rollback(opts['client'], opts['done']);
              callback(err, null);
            }
          }, opts);
        });
      };

      // check if in transaction
      // if no just begin one
      if (_.has(opts, 'inTransaction') && opts.inTransaction) {
        processIt();
      } else {
        options.kit.begin(function(err, client, done) {
          if (err) {
            return;
          }

          opts['inTransaction'] = true;
          opts['client'] = client;
          opts['done'] = done;

          topOne = true;

          processIt();
        });
      }
    };

    this.delete = function(callback) {
      if (this.id == null) {
        callback('can\'t delete object without "id" field value');
      } else {
        options.model.delete({id:values.id}, callback);
      }
    };

    this.toJson = function() {
      return JSON.stringify(values);
    };

    this.toString = function() {
      return values;
    };
  };

}());
