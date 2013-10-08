(function () {
  "use strict";

  var _ = require('lodash'),
  types = {
    SMALLINT: 'smallint',
    INT: 'integer',
    BIGINT: 'bigint',
    DEC: 'decimal',
    NUM: 'numeric',
    REAL: 'real',
    DOUBLE: 'double precision',
    SERIAL: 'serial',
    BIGSERIAL: 'bigserial',

    MONEY: 'money',

    STRING: 'varchar(255)',
    CHARS: 'char(255)',
    TEXT: 'text',

    BYTEA: 'bytea',

    TIMESTAMP: 'timestamp',
    TIMESTAMPTZ: 'timestamp with time zone',
    DATE: 'date',
    TIME: 'time',
    TIMETZ: 'time with time zone',
    INTERVAL: 'interval',

    BOOL: 'boolean',

    POINT: 'point',
    LINE: 'line',
    LSEG: 'lseg',
    BOX: 'box',
    PATH: 'path',
    POLYGON: 'polygon',
    CIRCLE: 'circle',

    CIDR: 'cidr',
    INET: 'inet',
    MACADDR: 'macaddr',

    enum: function(typeName, values) {
      return {
        dataType: 'enum',
        typeName: typeName,
        values: values
      };
    },
    string: function(length) { return 'varchar(' + length + ')'; }
  };

  _.each(types, function(v, k) {
    if ( _.isFunction(v) ) {
      module.exports[k] = v;
    } else {
      module.exports.__defineGetter__(k, function() {
        return v;
      });
    }
  });

}());
