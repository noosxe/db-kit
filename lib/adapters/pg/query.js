module.exports = (function() {
  "use strict";

  var events = require('events');

  var Query = function() {

  };

  Query.prototype.run = function(queryObject, options) {
    var eventEmitter = new events.EventEmitter()
      , $this = this;

    this.connect({
      native: options.native,
      connString: options.kit.configs.connString,
      username: options.kit.configs.username,
      password: options.kit.configs.password,
      host: options.kit.configs.host,
      port: options.kit.configs.port,
      database: options.kit.configs.database
    }).on('done', function(client, done) {
      $this.query(queryObject, client).on('done', function(results) {
        eventEmitter.emit('done', results.rows, results.fields, results);
        done();
      }).on('error', function(err) {
        done(err);
        eventEmitter.emit('error', err);
      });
    }).on('error', function(err) {
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
    client.query(queryObject).on('row', function(row) {
      rows.push(row);
    }).on('end', function(results) {
      if (rows.length > 0) {
        results.rows = rows;
        eventEmitter.emit('done', results);
      }
    }).on('error', function(err) {
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

    pg.connect(connString, function(err, client, done) {
      if (err) {
        eventEmitter.emit('error', err);
      } else {
        eventEmitter.emit('done', client, done);
      }
    });

    return eventEmitter;
  };

  return new Query();

}());
