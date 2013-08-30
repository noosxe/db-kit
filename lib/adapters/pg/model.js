(function() {
  "use strict";

  var crypto = require('crypto');
  var _ = require('underscore');
  _.str = require('underscore.string');
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
    var tableName = modelName;
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

    this.fieldType = function(fieldName) {
      return this.hasField(fieldName) ? attributes[fieldName].type : null;
    };

    this.getReference = function(fieldName) {
      return this.hasField(fieldName) && this.isReference(fieldName) ? attributes[fieldName].reference : null;
    };

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
          column += ' REFERENCES ' + quote(ref.entity.getTableName()) + '(' + quote(ref.field || 'id')  + ')';
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
      options = _.extend(options || {}, {
        kit: this.getOptions().kit,
        model: this
      });
      var KitObject = require('./object');
      return new KitObject(values, options);
    };

    this.fromJson = function(json) {
      return this.build(JSON.parse(json));
    };

    /**
     * Generate query's where part
     *
     * @param where actual query data
     * @param i index to use for $ placeholders
     * @returns {{string: string, values: Array}}
     */
    var genWhere = function(where, i) {
      var c = [];
      var values = [];

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

      return { string: c.join(' AND '), values:values };
    };

    /**
     * Generate query's fields part
     * requires model to be provided as context (this)
     *
     * @param qFields
     * @param owner
     * @returns {{columns: {}, tableName: *}}
     */
    var genFields = function(qFields, owner) {
      var fieldNames = this.getFieldNames();
      owner = owner || this.getModelName();
      var tableName = this.getTableName();
      var columns = {};
      columns['id'] = owner + '_id';
      // if query has 'fields' specified
      if (qFields && _.isArray(qFields) && qFields.length > 0) {
        _.each(qFields, function(field) {
            if (_.contains(fieldNames, field)) {
              columns[field] = owner + '_' + field;
            } else {
              throw new Error('field ' + quote(field) + ' was not defined!');
            }
        });
      } else {
        _.each(fieldNames, function(value) {
          if (!this.isHidden(value)) {
            columns[value] = owner + '_' + value;
          }
        }, this);
      }

      return { columns: columns, tableName: tableName };
    };

    this.find = function(query, callback) {
      var fieldNames = this.getFieldNames();
      var columns = {};
      var values = [];
      var i = 1;
      var q = 'SELECT ';

      if (_.has(query, 'include') && _.isArray(query.include) && query.include.length > 0) {
        query.fields = _.union(fieldNames, query.include);
      }

      if (_.has(query, 'exclude') && _.isArray(query.exclude) && query.exclude.length > 0) {
        query.fields = _.without(fieldNames, query.exclude);
      }

      // generate columns to select
      var ret = genFields.call(this, query.fields);
      columns[ret.tableName] = ret.columns;

      var jData = [];
      // generate join columns
      if (_.has(query, 'join') && _.isArray(query.join) && query.join.length > 0) {
        _.each(query.join, function(v){
          if (_.str.count(v, '.')) {
            var parts = v.split('.');
            var entities = [];
            var referred = _.reduce(parts, function(m, pv, ind) {
              return entities[ind] = m.getReference(pv).entity;
            }, this, this);
            var ret = genFields.call(referred, null, this.getModelName() + '_' + parts.join('_'));
            columns[ret.tableName] = ret.columns;
            var on = '(' + quote(entities[entities.length - 2].getTableName()) + '.' + quote(_.last(parts)) + ' = ' + quote(referred.getTableName()) + '."id")';
            jData.push({tableName: referred.getTableName(), on: on});
          } else {
            if (_.contains(fieldNames, v)) {
              if (this.isReference(v)) {
                var referred = attributes[v].reference.entity;
                var ret = genFields.call(referred, null, this.getModelName() + '_' + v);
                columns[ret.tableName] = ret.columns;
                var on = '(' + quote(this.getTableName()) + '.' + quote(v) + ' = ' + quote(referred.getTableName()) + '."id")';
                jData.push({tableName: referred.getTableName(), on: on});
              } else {
                throw new Error('field ' + quote(v) + ' was not defined as reference!');
              }
            } else {
              throw new Error('field ' + quote(v) + ' is not defined!');
            }
          }
        }, this);
      }

      // add column names to query
      q += _.map(columns, function(cln, tn) {
        return _.map(cln, function(v, k) {
          return quote(tn) + '.' + quote(k) + ( v === k ? '' : ' AS ' + quote(v) );
        }).join(', ');
      }).join(', ');

      q += ' FROM ' + quote(tableName);

      // generate join table names
      if (jData.length > 0) {
        q += _.map(jData, function(jTable) {
          return ' JOIN ' + quote(jTable.tableName) + ' ON ' + jTable.on;
        }).join(' ');
      }

      // if query has 'where' specified
      if (_.has(query, 'where') && _.isObject(query.where) && !_.isEmpty(query.where)) {
        var ret = genWhere.call(this, query.where, i);

        if (ret.string.length > 0) {
          q += ' WHERE ' + ret.string;
          values = values.concat(ret.values);
          i += ret.values.length;
        }
      }

      if (_.has(query, 'limit') && query.limit > 0) {
        q += ' LIMIT $' + i++;
        values.push(query.limit);
      }

      if (_.has(query, 'offset') && query.offset > 0) {
        q += ' OFFSET $' + i++;
        values.push(query.offset);
      }

      if (_.has(query, 'order') && _.isArray(query.order) && query.order.length > 0) {
        var orders = [];
        _.each(query.order, function(v) {
          v = v.split(' ');
          var path = v[0].split('.');
          orders.push(quote(options.kit.models[path[0]].getTableName()) + '.' + quote(path[1]) + ' ' + v[1]);
        });
        q += ' ORDER BY ' + orders.join(', ');
      }

      var $this = this;

      options.kit.query({
        name: 'select_from_' + tableName + '_' + md5(q),
        text: q,
        values: values
      }, function(err, rows, result) {
        var returning = [];

        if (!err) {
          // for each of found rows generate KitObjects
          returning = _.map(rows, function(row) {
            var obj = {};

            // for each of row fields check if field is from nested object
            // and generate inner objects
            _.each(row, function(v, k) {
              k = _.rest(k.split('_'));

              var r = obj;
              while(k.length) {
                var p = k.shift();
                if (k.length == 0) {
                  r[p] = v;
                } else if (!_.has(r, p) || !_.isObject(r[p])) {
                  r[p] = {};
                }
                r = r[p];
              }
            });

            return this.build(obj, { fromDB:true });
          }, $this);
        }

        if (callback) {
          callback(err, returning);
        }
      });
    };

    this.delete = function(where, callback) {
      var values = [];
      var i = 1;
      var q = 'DELETE FROM ' + quote(tableName);

      var ret = genWhere.call(this, where, i);

      if (ret.string.length > 0) {
        q += ' WHERE ' + ret.string;
        values = values.concat(ret.values);
        i += ret.values.length;
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

    this.update = function(where, replace, callback) {
      var values = [];
      var columns = [];
      var i = 1;
      var q = 'UPDATE ' + quote(tableName);

      _.each(replace, function(v, k) {
        columns.push(quote(k) + ' = $' + i++);
        values.push(v);
      }, this);

      q += ' SET ' + columns.join(', ');

      var ret = genWhere.call(this, where, i);

      if (ret.string.length > 0) {
        q += ' WHERE ' + ret.string;
        values = values.concat(ret.values);
        i += ret.values.length;
      }

      options.kit.query({
        name: 'update_' + tableName + '_' + md5(q),
        text: q,
        values: values
      }, function(err, rows, result) {
        if (callback) {
          callback(err, result.rowCount || 0);
        }
      });
    };
  };

}());
