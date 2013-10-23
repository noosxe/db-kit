(function () {
  "use strict";

  var pg = require('pg');
  var _ = require('underscore');

  module.exports.types = require('./types');
  module.exports.typeExists = function(type) {
    return _.values(module.exports.types).indexOf(type) != -1;
  };

  module.exports.defineModel = function(modelName, attributes, options) {
    var Model = require('./model');
    return new Model(modelName, attributes, options);
  };

  module.exports.query = function(queryObject, callback, options) {

    if (options.client) {

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

      options.client.query(queryObject, function(err, result) {
        if (err && options.kit.options.debug) {
          console.log('===================');
          console.log('Error during query!');
          console.log(err);
          console.log('===================');
        }
        callback(err, (result && result.rows) || [], result);
      });

    } else {

      var conf = options.kit.config;
      var conString = conf.connString || 'postgres://' + conf.username + ':' + conf.password + '@' + conf.host + '/' + conf.database;

      pg.connect(conString, function(err, client, done) {
        if (err) {
          if (options.kit.options.debug) {
            console.log('Error while trying to fetch client from pool');
            console.log(err);
          }
          done(err);
          callback(err, [], null);
          return;
        }

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

        client.query(queryObject, function(err, result) {
          if (err && options.kit.options.debug) {
            console.log('===================');
            console.log('Error during query!');
            console.log(err);
            console.log('===================');
          }
          done(err);
          callback(err, (result && result.rows) || [], result);
        });
      });
    }

  };

  module.exports.begin = function(callback, options) {
    var conf = options.kit.config;
    var conString = conf.connString || 'postgres://' + conf.username + ':' + conf.password + '@' + conf.host + '/' + conf.database;

    pg.connect(conString, function(err, client, done) {
      if (err) {
        if (options.kit.options.debug) {
          console.log('Error while trying to fetch client from pool');
          console.log(err);
        }
        done(err);
        callback(err, null, null);
        return;
      }

      client.query('BEGIN', function(err) {
        if (err) {
          if (options.kit.options.debug) {
            console.log('Error while trying to begin a transaction');
            console.log(err);
          }
          options.kit.rollback(client, done);
          callback(err, null, null);
          return;
        }

        if (options.kit.options.debug) {
          console.log('\n===================');
          console.log('beginning transaction');
        }

        callback(null, client, done);
      });
    });
  };

  module.exports.rollback = function(client, done) {
    client.query('ROLLBACK', function(err) {
      done(err);
    });
  };

  module.exports.commit = function(client, done, callback) {
    client.query('COMMIT', function(err) {
      done(err);
      callback(err);
    });
  };

}());
