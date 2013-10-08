(function() {
  "use strict";

  var functions = require('./functions')
    , md5 = require('./util').md5;

  module.exports = {
    createEnumType: function(typeName, values, options) {
      typeName = 'enum_' + typeName;
      var funcName = 'func_create_enum_' + typeName;
      var r = functions.createEnumTypeFunction(funcName, typeName, values);

      options.kit.query({
        text: r.q,
        name: 'func_create_enum_' + md5(r.q),
        values: r.v
      }, { executor: options.executor });

      options.kit.query({
        text: 'SELECT ' + funcName + '()',
        name: 'exec_func_' + funcName,
        values: []
      }, { executor: options.executor });

      return typeName;
    }
  };

}());
