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
    var conf = options.kit.config;
    var conString = 'postgres://' + conf.username + ':' + conf.password + '@' + conf.host + '/' + conf.database;

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
        console.log('running query:');
        console.log(queryObject.text);
        console.log('with values:');
        console.log(queryObject.values);
      }

      client.query(queryObject, function(err, result) {
        if (err && options.kit.options.debug) {
          console.log('Error during query!');
          console.log(err);
        }
        done(err);
        callback(err, result && result.rows || [], result);
      });
    });
  };

}());
