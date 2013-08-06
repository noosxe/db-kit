(function () {
    "use strict";

    module.exports = {
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

        string: function(length) { return 'varchar(' + length + ')'; }
    };

}());
