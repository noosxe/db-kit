(function() {
  "use strict";
  var events = require('events')
    , _ = require('lodash');

  function connect(kit, eventEmitter) {
    var pg = kit.options.native ? require('pg').native : require('pg');

    var conf = kit.configs;
    var conString = conf.connString || 'postgres://' + conf.username + ':' + conf.password + '@' + conf.host + '/' + conf.database;

    pg.connect(conString, function(err, client, callback) {
      if (err) {
        callback(err);
        return eventEmitter.emit('internalError', err);
      }

      return eventEmitter.emit('internalConnected', client, callback);
    });
  }

  function execQuery(queryObject, client, eventEmitter, finalize, callback, executor, debug) {
    function exec(ex, providedClient) {
      client = providedClient || client;

      if (debug) {
        console.log("\n==============");
        console.log("executing query:");
        if (_.isObject(queryObject)) {
          console.log("\t", queryObject.text);
          console.log("with values:");
          console.log(queryObject.values);
        } else {
          console.log("\t", queryObject);
        }
      }

      client.query(queryObject, function(err, result) {
        if (finalize) {
          callback(err);
        }

        if (ex) {
          ex();
        }

        if (err) {
          return eventEmitter.emit('internalError', err);
        }

        return eventEmitter.emit('internalDone', result);
      });
    }

    if (executor) {
      executor.addTask(exec);
    } else {
      exec();
    }
  }

  module.exports.query = function(queryObject, options) {
    var eventEmitter = options.eventEmitter || new events.EventEmitter();
    var executor = options.executor || null;

    if (options.client) {
      process.nextTick(function() {
        executor.addTask(function(callback) {
          execQuery(queryObject, options.client, eventEmitter, false, null, executor, options.kit.options.debug);
        });
      });
    } else {
      process.nextTick(function() {
        connect(options.kit, eventEmitter);
      });
    }

    eventEmitter.on('internalConnected', function(client, callback) {
      execQuery(queryObject, client, eventEmitter, true, callback, executor, options.kit.options.debug);
    });

    eventEmitter.on('internalError', function(err) {
      console.log("\n====================");
      console.log("error executing query:");

      if (_.isObject(queryObject)) {
        console.log("\t", queryObject.text);
        console.log("with values:");
        console.log("\t", queryObject.values);
      } else {
        console.log("\t", queryObject);
      }

      console.log(err);
    });

    return eventEmitter;
  };

  module.exports.connect = connect;

  module.exports.begin = function(options) {
    var eventEmitter = options.eventEmitter || new events.EventEmitter();

    process.nextTick(function() {
      connect(options.kit, eventEmitter);
    });

    eventEmitter.on('internalConnected', function(client, done) {
      client.query('BEGIN').on('done', function() {
        if (options.kit.options.debug) {
          console.log('\n===================');
          console.log('beginning transaction');
        }

        eventEmitter.emit('done', client, done);
      }).on('error', function(err) {
        if (options.kit.options.debug) {
          console.log('Error while trying to begin a transaction');
          console.log(err);
        }

        options.kit.rollback(client, done);
        eventEmitter.emit('error', err);
      });
    });

    return eventEmitter;
  };

  module.exports.rollback = function(client, done) {
    client.query('ROLLBACK', function(err) {
      done(err);
    });
  };

  module.exports.commit = function(client, done) {
    var eventEmitter = new events.EventEmitter();

    process.nextTick(function() {
      client.query('COMMIT', function(err) {
        done(err);
        if (err) {
          eventEmitter.emit('error', err);
        } else {
          eventEmitter.emit('done');
        }
      });
    });

    return eventEmitter;
  };

}());
