var _ = require('lodash')
  , async = require('async')
  , adapters = require('./adapters')
  , events = require('events');

module.exports = (function() {
  "use strict";

  var Kit = function (database, username, password, options) {

    if (_.isObject(database)) {
      options = database;
    } else if (_.isObject(password)) {
      options = password;
      password = '';
    }

    this.options = _.defaults(options || {}, {
      adapter: adapters.POSTGRES,
      host: 'localhost',
      native: false,
      debug: false
    });

    var Adapter = adapters[this.options.adapter]();
    this.adapter = new Adapter(this);

    this.configs = {
      host: this.options.host,
      port: this.options.port || this.adapter.port,
      database: database,
      username: username,
      password: password || '',
      connString: this.options.connString || null
    };
  };

  Kit.prototype.models = {};

  Kit.prototype.__defineGetter__('types', function() {
    return this.adapter.types;
  });

  Kit.__defineGetter__('adapters', function() {
    return adapters;
  });

  Kit.prototype.define = function(modelName, attributes, options) {
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
    return this.adapter.query(queryObject, options);
  };

  Kit.prototype.executor = function(options) {
    return this.adapter.executor(options);
  };

  Kit.prototype.begin = function(client) {
    return this.adapter.begin.apply(this.adapter, arguments);
  };

  Kit.prototype.rollback = function(client) {
    return this.adapter.rollback.apply(this.adapter, arguments);
  };

  Kit.prototype.commit = function(client) {
    return this.adapter.commit.apply(this.adapter, arguments);
  };

  Kit.prototype.sync = function() {
    var resolved = []
      , models = _.toArray(this.models)
      , eventEmitter = new events.EventEmitter();

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
      item.sync().on('done', function(model) {
        fn(null, model);
      }).on('error', function(err) {
        fn(err);
      });
    }, function(err) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('done');
      }
    });

    return eventEmitter;
  };

  return Kit;
}());
