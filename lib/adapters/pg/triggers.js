(function() {
  "use strict";

  /**
   * Quote a string
   *
   * @param string
   * @returns {string}
   */
  function quote(string) {
    return '"' + string + '"';
  }

  module.exports.beforeDelete = function(triggerName, tableName, functionName) {
    return 'CREATE TRIGGER ' + quote(triggerName) + ' BEFORE DELETE ON ' + quote(tableName) + ' FOR EACH ROW EXECUTE PROCEDURE ' + quote(functionName) + '();';
  };

}());
