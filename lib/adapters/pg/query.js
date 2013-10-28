module.exports = (function() {
  "use strict";

  var events = require('events')
    , _ = require('lodash');

  var Query = function() {

  };

  Query.prototype.run = function(queryObject, options) {
    var eventEmitter = new events.EventEmitter()
      , $this = this;

    this.connect({
      native: options.kit.options.native,
      connString: options.kit.configs.connString,
      username: options.kit.configs.username,
      password: options.kit.configs.password,
      host: options.kit.configs.host,
      port: options.kit.configs.port,
      database: options.kit.configs.database
    }).on('done', function(client, done) {
      if (options.kit.options.debug) {
        if (_.isObject(queryObject)) {
          console.log('\n===================');
          console.log('running query:');
          console.log("\t", queryObject.text);
          console.log('with values:');
          console.log("\t", queryObject.values);
          console.log('===================\n');
        } else {
          console.log('\n===================');
          console.log('running query:');
          console.log("\t", queryObject);
        }
      }
      $this.query(queryObject, client).on('done', function(results) {
        done();
        eventEmitter.emit('done', results.rows, results.fields, results);
      }).on('error', function(err) {
        done(err);
        eventEmitter.emit('error', err);
      });
    }).on('error', function(err) {
      if (options.kit.options.debug) {
        console.log(err);
      }
      eventEmitter.emit('error', err);
    });

    return eventEmitter;
  };

  Query.prototype.begin = function(client) {
    var eventEmitter = new events.EventEmitter();

    client.query('BEGIN', function(err) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('done');
      }
    });

    return eventEmitter;
  };

  Query.prototype.query = function(queryObject, client) {
    var eventEmitter = new events.EventEmitter();
    var rows = [];
    var error = false;
    client.query(queryObject).on('row', function(row) {
      rows.push(row);
    }).on('end', function(results) {
      if (!error) {
        results.rows = rows;
        eventEmitter.emit('done', results);
      }
    }).on('error', function(err) {
      error = true;
      eventEmitter.emit('error', err);
    });

    return eventEmitter;
  };

  Query.prototype.rollback = function(client) {
    var eventEmitter = new events.EventEmitter();

    client.query('ROLLBACK', function(err) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('done');
      }
    });

    return eventEmitter;
  };

  Query.prototype.commit = function(client) {
    var eventEmitter = new events.EventEmitter();

    client.query('COMMIT', function(err) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('done');
      }
    });

    return eventEmitter;
  };

  Query.prototype.connect = function(connOptions) {
    var connString = connOptions.connString || (
      "postgres://" + connOptions.username
        + ":" + connOptions.password
        + "@" + connOptions.host
        + ":" + connOptions.port
        + "/" + connOptions.database)
      , pg = connOptions.native ? require('pg').native : require('pg')
      , eventEmitter = new events.EventEmitter();

    process.nextTick(function() {
      pg.connect(connString, function(err, client, done) {
        if (err) {
          eventEmitter.emit('error', err);
        } else {
          eventEmitter.emit('done', client, done);
        }
      });
    });

    return eventEmitter;
  };

  return new Query();

}());
