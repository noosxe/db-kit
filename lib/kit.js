(function () {
  "use strict";

  var _ = require('underscore');
  var adapters = require('./adapters');

  module.exports = (function() {
    var Kit = function(database, username, password, options) {
      options = options || {};

      this.options = _.extend({
        adapter: adapters.POSTGRES,
        host: 'localhost',
        debug: false,
        quotes: true
      }, options);

      this.config = {
        host: this.options.host,
        port: this.options.port,
        database: database,
        username: username,
        password: password
      };

      this.adapter = adapters[this.options.adapter]();
    };

    Kit.prototype.define = function(modelName, attributes, options) {

    };

    Kit.prototype.isDefined = function(modelName) {

    };

    Kit.prototype.query = function() {

    };

    Kit.prototype.sync = function() {

    };

    return Kit;
  })();

}());
