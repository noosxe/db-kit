var _ = require('lodash')
  , dataTypes = require('./dataTypes')
  , quote = require('./util').quote
  , md5 = require('./util').md5;

(function() {
  "use strict";

  module.exports = {
    createTable: function(attributes, options) {
      var q = "CREATE TABLE IF NOT EXISTS " + quote(options.tableName);

      var columns = [];
      _.forEach(attributes, function(attrProps, attrName) {
        var attrType = attrProps.type;

        var isArrayType = _.isArray(attrType);

        if (_.isFunction(attrType)) {
          attrType = attrType();
        }

        if (_.isObject(attrType)) {
          switch (attrType.dataType) {
            case 'enum':
              attrType = dataTypes.createEnumType(attrType.typeName, attrType.values, _.defaults(_.clone(options), {
                queryGenerator: this
              }));
              break;
          }
        }

        if (isArrayType) {
          attrType += '[]';
        }

        var column = quote(attrName) + ' ' + attrType;

        if (_.has(attrProps, 'default') && attrProps.default) {
          column += ' DEFAULT ' + (_.isFunction(attrProps.default) ? attrProps.default() : attrProps.default);
        }

        if (_.has(attrProps, 'required') && attrProps.required) {
          column += ' NOT NULL';
        }

        if (_.has(attrProps, 'unique') && attrProps.unique) {
          column += ' UNIQUE';
        }

        if (_.has(attrProps, 'primary') && attrProps.primary) {
          column += ' PRIMARY KEY';
        }

        if (_.has(attrProps, 'reference') && attrProps.reference) {
          var entity = attrProps.reference.entity;
          var field = attrProps.reference.field;

          column += ' REFERENCES ' + quote(entity.options.tableName) + '(' + quote(field) + ')';
        }

        columns.push(column);
      }, this);

      q += ' (' + columns.join(', ') + ')';

      return { q: q, v: [] };
    },

    dropTable: function(tableName) {
      return { q: "DROP TABLE IF EXISTS " + quote(tableName), v: []};
    },

    insert: function() {

    },

    update: function() {

    },

    delete: function() {

    },

    select: function() {

    },

    dropType: function(typeName) {
      return { q: "DROP TYPE IF EXISTS " + quote(typeName), v: []};
    },

    renameType: function(typeName, newName) {
      return { q: "ALTER TYPE " + quote(typeName) + " RENAME TO " + quote(newName), v: []};
    }
  };

}());