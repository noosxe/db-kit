var _ = require('lodash')
  , async = require('async')
  , events = require('events')
  , adapters = require('./adapters');

module.exports = (function() {
  "use strict";

  var Kit = function (database, username, password, options) {

    if (_.isObject(database)) {
      options = database;
    } else if (_.isObject(password)) {
      options = password;
    }

    this.options = _.defaults(options || {}, {
      adapter: adapters.POSTGRES,
      host: 'localhost',
      debug: false,
      quotes: true
    });

    this.configs = {
      host: this.options.host,
      port: this.options.port,
      database: database,
      username: username,
      password: password || '',
      connString: this.options.connString || null
    };

    var Adapter = adapters[this.options.adapter]();
    this.adapter = new Adapter();
  };

  Kit.prototype.models = {};

  Kit.prototype.__defineGetter__('types', function() {
    return this.adapter.types;
  });

  Kit.__defineGetter__('adapters', function() {
    return adapters;
  });

  Kit.prototype.define = function(modelName, attributes, options) {
    options = _.defaults(options || {}, {
      kit: this
    });

    this.models[modelName] = this.adapter.defineModel(modelName, attributes, options);

    return this.models[modelName];
  };

  Kit.prototype.isDefined = function(modelName) {
    return _.has(this.models, modelName);
  };

  Kit.prototype.getDefinedModels = function() {
    return _.keys(this.models);
  };

  Kit.prototype.query = function(queryObject, options) {
    options = _.defaults(options || {}, {
      kit: this
    });

    var eventEmitter = this.adapter.query(queryObject, options);

    if (events.EventEmitter.listenerCount(eventEmitter, 'internalDone') === 0) {
      eventEmitter.on('internalDone', function(results) {
        eventEmitter.emit('done', results.rows || [], results.fields);
      });
    }
    return eventEmitter;
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

  Kit.prototype.sync = function(callback) {
    var resolved = [];
    var models = _.toArray(this.models);

    var resolver = function(node) {
      var deps = node.getDependencies();

      _.each(deps, function(value) {
        if (resolved.indexOf(value) === -1) {
          resolver(value);
        }
      });
      resolved.push(node);
    };

    _.each(models, function(value) {
      if (resolved.indexOf(value) === -1) {
        resolver(value);
      }
    });

    async.mapSeries(resolved, function(item, fn) {
      item.sync(function(err) {
        fn(err, item);
      });
    }, function(err) {
      if (callback) {
        callback(err);
      }
    });
  };

  return Kit;
}());
