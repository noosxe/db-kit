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
      this.models = {};

      this.__defineGetter__('types', function() {
        return this.adapter.types;
      });
    };

    Kit.prototype.define = function(modelName, attributes, options) {
      options = _.extend({
        kit: this
      }, options || {});
      return this.models[modelName] = this.adapter.defineModel(modelName, attributes, options);
    };

    Kit.prototype.isDefined = function(modelName) {
      return _.has(this.models, modelName);
    };

    Kit.prototype.getDefinedModels = function() {
      return _.keys(this.models);
    };

    Kit.prototype.query = function() {

    };

    Kit.prototype.sync = function() {

    };

    return Kit;
  })();

}());
