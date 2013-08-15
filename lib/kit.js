(function () {
  "use strict";

  var _ = require('underscore');
  var async = require('async');
  var adapters = require('./adapters');

  module.exports = (function() {

    /**
     * Kit class
     *
     * @param database
     * @param username
     * @param password
     * @param options
     * @constructor
     */
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
        password: password || ''
      };

      this.adapter = adapters[this.options.adapter]();
      this.models = {};

      this.__defineGetter__('types', function() {
        return this.adapter.types;
      });
    };

    /**
     * Define a model
     *
     * @param modelName
     * @param attributes
     * @param options
     * @returns {*}
     */
    Kit.prototype.define = function(modelName, attributes, options) {
      options = _.extend({
        kit: this
      }, options || {});
      return this.models[modelName] = this.adapter.defineModel(modelName, attributes, options);
    };

    /**
     * Check if model with given name is defined
     *
     * @param modelName
     * @returns {*}
     */
    Kit.prototype.isDefined = function(modelName) {
      return _.has(this.models, modelName);
    };

    /**
     * Return defined models names
     *
     * @returns {Array}
     */
    Kit.prototype.getDefinedModels = function() {
      return _.keys(this.models);
    };

    /**
     * Query the database
     *
     * @param queryObject
     * @param callback
     * @param options
     */
    Kit.prototype.query = function(queryObject, callback, options) {
      options = _.extend({
        kit: this
      }, options || {});
      this.adapter.query(queryObject, callback, options);
    };

    Kit.prototype.begin = function(callback) {
      this.adapter.begin(callback, { kit: this });
    };

    Kit.prototype.rollback = function(client, done) {
      this.adapter.rollback(client, done);
    };

    Kit.prototype.commit = function(client, done, callback) {
      this.adapter.commit(client, done, callback);
    };

    /**
     * Sync all models
     *
     * @param callback
     */
    Kit.prototype.sync = function(callback) {
      var resolved = [];
      var models = _.toArray(this.models);

      var resolver = function(node) {
        var deps = node.getDependencies();

        _.each(deps, function(value) {
          if (resolved.indexOf(value) == -1) {
            resolver(value);
          }
        });
        resolved.push(node);
      };

      _.each(models, function(value) {
        if (resolved.indexOf(value) == -1) {
          resolver(value);
        }
      });

      async.mapSeries(resolved, function(item, fn) {
        item.sync(function(err) {
          fn(err, item);
        })
      }, function(err) {
        if (callback) {
          callback(err);
        }
      });
    };

    return Kit;
  })();

}());
