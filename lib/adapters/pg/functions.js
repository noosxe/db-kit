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

  module.exports.beforeDeleteReferringFunction = function(functionName, referringTable, referringField, thisField) {
    return 'CREATE OR REPLACE FUNCTION ' + quote(functionName) + '() RETURNS TRIGGER AS'
      + '\n$$'
      + '\nBEGIN'
      + '\nDELETE FROM ' + quote(referringTable) + ' WHERE ' + quote(referringTable) + '.'
      + quote(referringField) + ' = ' + 'OLD.' + quote(thisField) + ';'
      + '\nRETURN OLD;'
      + '\nEND;'
      + '\n$$ LANGUAGE plpgsql;';
  };

}());
