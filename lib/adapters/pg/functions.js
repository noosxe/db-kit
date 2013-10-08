(function() {
  "use strict";

  var quote = require('./util').quote;

  module.exports.beforeDeleteReferringFunction = function(functionName, referringTable, referringField, thisField) {
    return {
      q: 'CREATE OR REPLACE FUNCTION ' + quote(functionName) + '() RETURNS TRIGGER AS'
        + '\n$$'
        + '\nBEGIN'
        + '\nDELETE FROM ' + quote(referringTable) + ' WHERE ' + quote(referringTable) + '.'
        + quote(referringField) + ' = ' + 'OLD.' + quote(thisField) + ';'
        + '\nRETURN OLD;'
        + '\nEND;'
        + '\n$$ LANGUAGE plpgsql;',
      v: []
    };
  };

  module.exports.createEnumTypeFunction = function(functionName, typeName, values) {
    return {
      q: 'CREATE OR REPLACE FUNCTION ' + quote(functionName) + '() RETURNS BOOL AS'
      + '\n$$'
      + '\nBEGIN'
      + '\nIF NOT (SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = \'' + typeName + '\')) THEN'
      + '\nCREATE TYPE ' + quote(typeName) + ' AS ENUM (\'' + values.join("', '") + '\');'
      + '\nEND IF;'
      + '\nRETURN TRUE;'
      + '\nEND;'
      + '\n$$ LANGUAGE plpgsql;',
      v: []
    };
  };

}());
